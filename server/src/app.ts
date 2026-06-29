import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { Queue, Worker, Job } from "bullmq";

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// ENV VALIDATION
// ---------------------------------------------------------------------------
const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
  "OPENAI_API_KEY",
  "REDIS_URL",
  "META_VERIFY_TOKEN",
  "META_ACCESS_TOKEN",
  "META_PHONE_NUMBER_ID",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "APP_PORT",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[BOOT] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CLIENTS
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const redisConnection = { url: process.env.REDIS_URL! };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT!),
  secure: Number(process.env.SMTP_PORT!) === 465,
  auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
});

// ---------------------------------------------------------------------------
// TYPESCRIPT TYPES
// ---------------------------------------------------------------------------
type TicketStatus =
  | "recibido"
  | "esperando_confirmacion"
  | "en_cola_facturacion"
  | "facturado"
  | "error";

type RegimenFiscal =
  | "601"
  | "603"
  | "605"
  | "606"
  | "608"
  | "609"
  | "610"
  | "611"
  | "612"
  | "614"
  | "616"
  | "620"
  | "621"
  | "622"
  | "623"
  | "624"
  | "625"
  | "626";

type UsoCFDI =
  | "G01"
  | "G02"
  | "G03"
  | "I01"
  | "I02"
  | "I03"
  | "I04"
  | "I05"
  | "I06"
  | "I07"
  | "I08"
  | "D01"
  | "D02"
  | "D03"
  | "D04"
  | "D05"
  | "D06"
  | "D07"
  | "D08"
  | "D09"
  | "D10"
  | "S01"
  | "CP01"
  | "CN01";

interface Usuario {
  id: string;
  whatsapp_number: string;
  nombre: string;
  rfc: string;
  correo: string;
  regimen_fiscal: RegimenFiscal;
  uso_cfdi: UsoCFDI;
  created_at: string;
}

interface Ticket {
  id: string;
  usuario_id: string;
  status: TicketStatus;
  comercio: string | null;
  rfc_emisor: string | null;
  fecha: string | null;
  hora: string | null;
  numero_ticket: string | null;
  subtotal: number | null;
  iva: number | null;
  total: number | null;
  forma_pago: string | null;
  imagen_url: string | null;
  xml_url: string | null;
  pdf_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface RegistrationSession {
  step:
    | "awaiting_rfc"
    | "awaiting_nombre"
    | "awaiting_correo"
    | "awaiting_regimen"
    | "awaiting_uso_cfdi"
    | "complete";
  rfc?: string;
  nombre?: string;
  correo?: string;
  regimen_fiscal?: RegimenFiscal;
}

// In-memory registration sessions (Redis-backed in production scale-out)
const registrationSessions = new Map<string, RegistrationSession>();

// ---------------------------------------------------------------------------
// ZOD SCHEMA — Structured Output for ticket extraction
// ---------------------------------------------------------------------------
const TicketExtractionSchema = z.object({
  comercio: z
    .string()
    .describe("Nombre del comercio tal como aparece en el ticket"),
  rfcEmisor: z
    .string()
    .describe("RFC del emisor del ticket, 12 o 13 caracteres"),
  fecha: z.string().describe("Fecha de la compra en formato YYYY-MM-DD"),
  hora: z.string().describe("Hora de la compra en formato HH:MM:SS"),
  numeroTicket: z.string().describe("Número de folio o ticket de la compra"),
  subtotal: z.number().describe("Subtotal antes de impuestos en pesos MXN"),
  iva: z.number().describe("Monto del IVA en pesos MXN"),
  total: z.number().describe("Total de la compra en pesos MXN"),
  formaPago: z
    .string()
    .describe(
      "Forma de pago: EFECTIVO, TARJETA_CREDITO, TARJETA_DEBITO, TRANSFERENCIA"
    ),
});

type TicketExtraction = z.infer<typeof TicketExtractionSchema>;

// ---------------------------------------------------------------------------
// BULLMQ QUEUES
// ---------------------------------------------------------------------------
const ticketProcessingQueue = new Queue("ticket-processing", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

const billingExecutionQueue = new Queue("billing-execution", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 10000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

// ---------------------------------------------------------------------------
// META WHATSAPP API HELPERS
// ---------------------------------------------------------------------------
const META_API_BASE = "https://graph.facebook.com/v19.0";

async function sendWhatsAppText(to: string, body: string): Promise<void> {
  await axios.post(
    `${META_API_BASE}/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function sendWhatsAppInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<void> {
  await axios.post(
    `${META_API_BASE}/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function downloadMetaMedia(mediaId: string): Promise<string> {
  const mediaRes = await axios.get(`${META_API_BASE}/${mediaId}`, {
    headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` },
  });
  const mediaUrl: string = mediaRes.data.url;
  const imgRes = await axios.get(mediaUrl, {
    headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` },
    responseType: "arraybuffer",
  });
  return Buffer.from(imgRes.data as ArrayBuffer).toString("base64");
}

// ---------------------------------------------------------------------------
// SUPABASE HELPERS
// ---------------------------------------------------------------------------
async function getUserByWhatsapp(
  number: string
): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("whatsapp_number", number)
    .maybeSingle();
  if (error) throw new Error(`Supabase getUserByWhatsapp: ${error.message}`);
  return data as Usuario | null;
}

async function createUsuario(
  payload: Omit<Usuario, "id" | "created_at">
): Promise<Usuario> {
  const { data, error } = await supabase
    .from("usuarios")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(`Supabase createUsuario: ${error.message}`);
  return data as Usuario;
}

async function createTicket(
  usuarioId: string,
  imagenUrl: string
): Promise<Ticket> {
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      usuario_id: usuarioId,
      status: "recibido" as TicketStatus,
      imagen_url: imagenUrl,
    })
    .select()
    .single();
  if (error) throw new Error(`Supabase createTicket: ${error.message}`);
  return data as Ticket;
}

async function updateTicket(
  ticketId: string,
  patch: Partial<Omit<Ticket, "id" | "created_at">>
): Promise<void> {
  const { error } = await supabase
    .from("tickets")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  if (error) throw new Error(`Supabase updateTicket: ${error.message}`);
}

async function getTicket(ticketId: string): Promise<Ticket> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();
  if (error) throw new Error(`Supabase getTicket: ${error.message}`);
  return data as Ticket;
}

// ---------------------------------------------------------------------------
// AI — TICKET EXTRACTION
// ---------------------------------------------------------------------------
async function extractTicketData(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<TicketExtraction> {
  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Eres un asistente especializado en leer tickets de compra mexicanos. " +
          "Extrae con precisión los datos solicitados. " +
          "Si un campo no está visible, usa cadena vacía o 0 según corresponda. " +
          "Las fechas siempre en formato YYYY-MM-DD y horas en HH:MM:SS.",
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "Extrae todos los datos de este ticket de compra mexicano.",
          },
        ],
      },
    ],
    response_format: zodResponseFormat(
      TicketExtractionSchema,
      "ticket_extraction"
    ),
    max_tokens: 1000,
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    throw new Error("OpenAI no devolvió datos estructurados del ticket");
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// EMAIL HELPERS
// ---------------------------------------------------------------------------
async function sendFacturaEmail(
  correo: string,
  nombre: string,
  ticket: Ticket
): Promise<void> {
  await transporter.sendMail({
    from: `"FacturaBot MX" <${process.env.SMTP_FROM}>`,
    to: correo,
    subject: `Tu factura de ${ticket.comercio} está lista`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00b140;">¡Hola ${nombre}!</h2>
        <p>Tu factura de <strong>${ticket.comercio}</strong> por <strong>$${ticket.total?.toFixed(2)} MXN</strong> ha sido generada exitosamente.</p>
        <p>Adjuntamos tu XML y PDF de la factura electrónica.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">FacturaBot MX — Facturación automática por WhatsApp</p>
      </div>
    `,
    attachments: [
      ...(ticket.xml_url
        ? [{ filename: `factura_${ticket.id}.xml`, path: ticket.xml_url }]
        : []),
      ...(ticket.pdf_url
        ? [{ filename: `factura_${ticket.id}.pdf`, path: ticket.pdf_url }]
        : []),
    ],
  });
}

// ---------------------------------------------------------------------------
// REGISTRATION FLOW
// ---------------------------------------------------------------------------
async function handleRegistrationFlow(
  from: string,
  messageText: string
): Promise<void> {
  let session = registrationSessions.get(from);

  if (!session) {
    session = { step: "awaiting_rfc" };
    registrationSessions.set(from, session);
    await sendWhatsAppText(
      from,
      "¡Bienvenido a *FacturaBot MX*! 🤖\n\n" +
        "Voy a registrarte para automatizar tu facturación.\n\n" +
        "Por favor, escribe tu *RFC* (12 o 13 caracteres):"
    );
    return;
  }

  if (session.step === "awaiting_rfc") {
    const rfc = messageText.trim().toUpperCase();
    const rfcRegex = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;
    if (!rfcRegex.test(rfc)) {
      await sendWhatsAppText(
        from,
        "❌ RFC inválido. Debe tener 12 caracteres (persona moral) o 13 (persona física).\n\nEscribe tu RFC nuevamente:"
      );
      return;
    }
    session.rfc = rfc;
    session.step = "awaiting_nombre";
    await sendWhatsAppText(from, "✅ RFC registrado.\n\nAhora escribe tu *nombre completo o razón social*:");
    return;
  }

  if (session.step === "awaiting_nombre") {
    const nombre = messageText.trim();
    if (nombre.length < 3) {
      await sendWhatsAppText(from, "❌ Nombre muy corto. Escribe tu nombre completo:");
      return;
    }
    session.nombre = nombre;
    session.step = "awaiting_correo";
    await sendWhatsAppText(from, "✅ Nombre registrado.\n\nEscribe tu *correo electrónico* para recibir las facturas:");
    return;
  }

  if (session.step === "awaiting_correo") {
    const correo = messageText.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      await sendWhatsAppText(from, "❌ Correo inválido. Escribe un correo electrónico válido:");
      return;
    }
    session.correo = correo;
    session.step = "awaiting_regimen";
    await sendWhatsAppText(
      from,
      "✅ Correo registrado.\n\nEscribe tu *Régimen Fiscal SAT*.\n\n" +
        "Los más comunes:\n" +
        "• *626* — Simplificado de Confianza (RESICO)\n" +
        "• *612* — Personas Físicas con Actividades Empresariales\n" +
        "• *601* — General de Ley Personas Morales\n\n" +
        "Escribe el número de 3 dígitos (ej: 626):"
    );
    return;
  }

  if (session.step === "awaiting_regimen") {
    const regimen = messageText.trim() as RegimenFiscal;
    const validRegimenes: RegimenFiscal[] = [
      "601","603","605","606","608","609","610","611","612",
      "614","616","620","621","622","623","624","625","626",
    ];
    if (!validRegimenes.includes(regimen)) {
      await sendWhatsAppText(from, "❌ Régimen fiscal no reconocido. Escribe un código válido (ej: 626):");
      return;
    }
    session.regimen_fiscal = regimen;
    session.step = "awaiting_uso_cfdi";
    await sendWhatsAppText(
      from,
      "✅ Régimen fiscal registrado.\n\nEscribe tu *Uso de CFDI*.\n\n" +
        "Los más comunes:\n" +
        "• *G03* — Gastos en general\n" +
        "• *G01* — Adquisición de mercancias\n" +
        "• *D10* — Pagos por servicios educativos\n\n" +
        "Escribe el código (ej: G03):"
    );
    return;
  }

  if (session.step === "awaiting_uso_cfdi") {
    const usoCfdi = messageText.trim().toUpperCase() as UsoCFDI;
    const validUsos: UsoCFDI[] = [
      "G01","G02","G03","I01","I02","I03","I04","I05","I06","I07","I08",
      "D01","D02","D03","D04","D05","D06","D07","D08","D09","D10",
      "S01","CP01","CN01",
    ];
    if (!validUsos.includes(usoCfdi)) {
      await sendWhatsAppText(from, "❌ Uso de CFDI no reconocido. Escribe un código válido (ej: G03):");
      return;
    }

    try {
      await createUsuario({
        whatsapp_number: from,
        nombre: session.nombre!,
        rfc: session.rfc!,
        correo: session.correo!,
        regimen_fiscal: session.regimen_fiscal!,
        uso_cfdi: usoCfdi,
      });

      registrationSessions.delete(from);

      await sendWhatsAppText(
        from,
        "🎉 *¡Registro completado exitosamente!*\n\n" +
          `📋 RFC: ${session.rfc}\n` +
          `👤 Nombre: ${session.nombre}\n` +
          `📧 Correo: ${session.correo}\n` +
          `🏛️ Régimen: ${session.regimen_fiscal}\n` +
          `📄 Uso CFDI: ${usoCfdi}\n\n` +
          "Ahora *envíame una foto de tu ticket de compra* y lo facturo automáticamente. 🚀"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Registration] Error creating user:", msg);
      registrationSessions.delete(from);
      await sendWhatsAppText(
        from,
        "❌ Error al guardar tu registro. Por favor intenta nuevamente escribiendo *hola*."
      );
    }
    return;
  }
}

// ---------------------------------------------------------------------------
// TICKET PROCESSING WORKER
// ---------------------------------------------------------------------------
const ticketProcessingWorker = new Worker(
  "ticket-processing",
  async (job: Job) => {
    const { ticketId, base64Image, whatsappNumber } = job.data as {
      ticketId: string;
      base64Image: string;
      whatsappNumber: string;
    };

    console.log(`[Worker:ticket-processing] Processing ticket ${ticketId}`);

    try {
      const extraction = await extractTicketData(base64Image);

      await updateTicket(ticketId, {
        status: "esperando_confirmacion",
        comercio: extraction.comercio,
        rfc_emisor: extraction.rfcEmisor,
        fecha: extraction.fecha,
        hora: extraction.hora,
        numero_ticket: extraction.numeroTicket,
        subtotal: extraction.subtotal,
        iva: extraction.iva,
        total: extraction.total,
        forma_pago: extraction.formaPago,
      });

      const confirmationText =
        `📋 *Datos extraídos de tu ticket:*\n\n` +
        `🏪 Comercio: ${extraction.comercio}\n` +
        `📅 Fecha: ${extraction.fecha} ${extraction.hora}\n` +
        `🧾 Folio: ${extraction.numeroTicket}\n` +
        `💰 Subtotal: $${extraction.subtotal.toFixed(2)}\n` +
        `🏦 IVA: $${extraction.iva.toFixed(2)}\n` +
        `💵 *Total: $${extraction.total.toFixed(2)} MXN*\n` +
        `💳 Forma de pago: ${extraction.formaPago}\n\n` +
        `¿Procedo con la facturación?`;

      await sendWhatsAppInteractiveButtons(whatsappNumber, confirmationText, [
        { id: `confirm_${ticketId}`, title: "👍 Sí, Facturar" },
        { id: `correct_${ticketId}`, title: "✏️ Corregir" },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Worker:ticket-processing] Error for ticket ${ticketId}:`, msg);

      await updateTicket(ticketId, {
        status: "error",
        error_message: `Error extrayendo datos: ${msg}`,
      });

      await sendWhatsAppText(
        whatsappNumber,
        "❌ No pude leer los datos de tu ticket. Asegúrate de que la foto sea clara y tenga buena iluminación, luego envíala nuevamente."
      );

      throw err;
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

ticketProcessingWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`[Worker:ticket-processing] Job ${job?.id} failed permanently:`, err.message);
});

// ---------------------------------------------------------------------------
// BILLING EXECUTION WORKER
// ---------------------------------------------------------------------------
const billingExecutionWorker = new Worker(
  "billing-execution",
  async (job: Job) => {
    const { ticketId, whatsappNumber } = job.data as {
      ticketId: string;
      whatsappNumber: string;
    };

    console.log(`[Worker:billing-execution] Executing billing for ticket ${ticketId}`);

    await updateTicket(ticketId, { status: "en_cola_facturacion" });

    let ticket: Ticket;
    let usuario: Usuario | null;

    try {
      ticket = await getTicket(ticketId);
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", ticket.usuario_id)
        .single();
      if (error) throw new Error(error.message);
      usuario = data as Usuario;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await updateTicket(ticketId, { status: "error", error_message: `Datos no encontrados: ${msg}` });
      throw err;
    }

    // Dynamically load the correct scraper based on the comercio
    let xmlPath: string;
    let pdfPath: string;

    try {
      const comercioKey = (ticket.comercio ?? "").toLowerCase().replace(/\s+/g, "");

      let scraper: {
        ejecutarFacturacion: (
          ticket: Ticket,
          usuario: Usuario
        ) => Promise<{ xmlPath: string; pdfPath: string }>;
      };

      if (comercioKey.includes("costco")) {
        scraper = await import("./scrapers/costco.scraper");
      } else {
        throw new Error(
          `Scraper no disponible para el comercio: ${ticket.comercio}. Próximamente.`
        );
      }

      ({ xmlPath, pdfPath } = await scraper.ejecutarFacturacion(ticket, usuario));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Worker:billing-execution] Scraper error for ticket ${ticketId}:`, msg);

      await updateTicket(ticketId, { status: "error", error_message: msg });
      await sendWhatsAppText(
        whatsappNumber,
        `❌ Error al facturar en ${ticket.comercio}: ${msg}\n\nIntenta nuevamente o contáctanos.`
      );
      throw err;
    }

    // Upload files to Supabase Storage
    const fs = await import("fs/promises");
    const path = await import("path");

    const xmlBuffer = await fs.readFile(xmlPath);
    const pdfBuffer = await fs.readFile(pdfPath);

    const xmlStoragePath = `facturas/${ticketId}/factura.xml`;
    const pdfStoragePath = `facturas/${ticketId}/factura.pdf`;

    const [xmlUpload, pdfUpload] = await Promise.all([
      supabase.storage.from("facturas").upload(xmlStoragePath, xmlBuffer, {
        contentType: "application/xml",
        upsert: true,
      }),
      supabase.storage.from("facturas").upload(pdfStoragePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      }),
    ]);

    if (xmlUpload.error) throw new Error(`XML upload: ${xmlUpload.error.message}`);
    if (pdfUpload.error) throw new Error(`PDF upload: ${pdfUpload.error.message}`);

    const { data: xmlUrlData } = supabase.storage
      .from("facturas")
      .getPublicUrl(xmlStoragePath);
    const { data: pdfUrlData } = supabase.storage
      .from("facturas")
      .getPublicUrl(pdfStoragePath);

    await updateTicket(ticketId, {
      status: "facturado",
      xml_url: xmlUrlData.publicUrl,
      pdf_url: pdfUrlData.publicUrl,
    });

    // Cleanup temp files
    await Promise.allSettled([
      fs.unlink(xmlPath),
      fs.unlink(pdfPath),
      fs.rmdir(path.dirname(xmlPath)),
    ]);

    // Notify user via WhatsApp
    const updatedTicket = await getTicket(ticketId);
    await sendWhatsAppText(
      whatsappNumber,
      `✅ *¡Tu factura está lista!* 🎉\n\n` +
        `🏪 ${ticket.comercio}\n` +
        `💵 Total: $${ticket.total?.toFixed(2)} MXN\n\n` +
        `📄 XML: ${xmlUrlData.publicUrl}\n` +
        `📑 PDF: ${pdfUrlData.publicUrl}\n\n` +
        `También te enviamos los archivos a *${usuario!.correo}* 📧`
    );

    // Send email
    try {
      await sendFacturaEmail(usuario!.correo, usuario!.nombre, updatedTicket);
    } catch (emailErr: unknown) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error(`[Worker:billing-execution] Email error for ticket ${ticketId}:`, msg);
      // Non-fatal: ticket already facturado, just log the email failure
    }
  },
  { connection: redisConnection, concurrency: 2 }
);

billingExecutionWorker.on("failed", (job: Job | undefined, err: Error) => {
  console.error(`[Worker:billing-execution] Job ${job?.id} failed permanently:`, err.message);
});

// ---------------------------------------------------------------------------
// EXPRESS APP
// ---------------------------------------------------------------------------
const app = express();

app.use(
  express.json({
    verify: (req: Request & { rawBody?: Buffer }, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);

// ---------------------------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------------------------
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// META WEBHOOK — VERIFICATION (GET)
// ---------------------------------------------------------------------------
app.get("/webhook/whatsapp", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    console.log("[Webhook] Meta verification successful");
    res.status(200).send(challenge);
    return;
  }

  res.status(403).json({ error: "Forbidden" });
});

// ---------------------------------------------------------------------------
// META WEBHOOK — MESSAGE HANDLER (POST)
// ---------------------------------------------------------------------------
app.post("/webhook/whatsapp", async (req: Request, res: Response) => {
  // Acknowledge Meta immediately (< 3 seconds requirement)
  res.status(200).json({ status: "ok" });

  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;

        const value = change.value;
        const messages: Array<{
          from: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
          };
        }> = value.messages ?? [];

        for (const message of messages) {
          const from: string = message.from;

          // ----------------------------------------------------------------
          // INTERACTIVE BUTTON REPLY
          // ----------------------------------------------------------------
          if (message.type === "interactive" && message.interactive?.button_reply) {
            const buttonId = message.interactive.button_reply.id;

            if (buttonId.startsWith("confirm_")) {
              const ticketId = buttonId.replace("confirm_", "");
              await updateTicket(ticketId, { status: "en_cola_facturacion" });
              await billingExecutionQueue.add("execute-billing", {
                ticketId,
                whatsappNumber: from,
              });
              await sendWhatsAppText(
                from,
                "⏳ *Facturando...* Esto puede tomar 1-3 minutos.\n\nTe notificaré cuando tu XML y PDF estén listos. ✨"
              );
              continue;
            }

            if (buttonId.startsWith("correct_")) {
              const ticketId = buttonId.replace("correct_", "");
              await updateTicket(ticketId, { status: "error", error_message: "Usuario solicitó corrección" });
              await sendWhatsAppText(
                from,
                "✏️ Entendido. Por favor, envíame una foto más clara del ticket o escríbeme manualmente:\n\n" +
                  "*Comercio, Fecha (YYYY-MM-DD), Total, Número de ticket*"
              );
              continue;
            }
            continue;
          }

          // ----------------------------------------------------------------
          // IMAGE MESSAGE — TICKET PHOTO
          // ----------------------------------------------------------------
          if (message.type === "image" && message.image) {
            const usuario = await getUserByWhatsapp(from);

            if (!usuario) {
              await sendWhatsAppText(
                from,
                "👋 ¡Hola! Primero necesito registrarte.\n\nEscribe *hola* para comenzar el registro."
              );
              continue;
            }

            const mediaId = message.image.id;
            const mimeType = message.image.mime_type ?? "image/jpeg";

            await sendWhatsAppText(
              from,
              "📸 *Foto recibida.* Analizando tu ticket con IA... 🤖\n\nEsto toma unos segundos."
            );

            // Upload original image to Supabase Storage
            let imagenUrl = "";
            try {
              const base64 = await downloadMetaMedia(mediaId);
              const imgBuffer = Buffer.from(base64, "base64");
              const storageKey = `tickets/${Date.now()}_${from}.jpg`;
              const { error: uploadErr } = await supabase.storage
                .from("tickets")
                .upload(storageKey, imgBuffer, { contentType: mimeType, upsert: false });
              if (!uploadErr) {
                const { data: urlData } = supabase.storage
                  .from("tickets")
                  .getPublicUrl(storageKey);
                imagenUrl = urlData.publicUrl;
              }

              const ticket = await createTicket(usuario.id, imagenUrl);

              await ticketProcessingQueue.add("process-ticket", {
                ticketId: ticket.id,
                base64Image: base64,
                whatsappNumber: from,
              });
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error("[Webhook] Image processing error:", msg);
              await sendWhatsAppText(
                from,
                "❌ Error al procesar tu imagen. Por favor intenta de nuevo."
              );
            }
            continue;
          }

          // ----------------------------------------------------------------
          // TEXT MESSAGE
          // ----------------------------------------------------------------
          if (message.type === "text" && message.text) {
            const text = message.text.body.trim().toLowerCase();
            const usuario = await getUserByWhatsapp(from);

            if (!usuario || registrationSessions.has(from)) {
              await handleRegistrationFlow(from, message.text.body);
              continue;
            }

            if (["hola", "hi", "hello", "inicio", "start", "menu"].includes(text)) {
              await sendWhatsAppText(
                from,
                `👋 ¡Hola *${usuario.nombre}*!\n\n` +
                  `🤖 *FacturaBot MX* — Tu asistente de facturación automática\n\n` +
                  `📸 Envíame una *foto de tu ticket* de compra y lo facturo automáticamente.\n\n` +
                  `Comercios disponibles:\n` +
                  `• Costco México ✅\n` +
                  `• Sam's Club (próximamente)\n` +
                  `• Liverpool (próximamente)\n` +
                  `• Walmart (próximamente)\n\n` +
                  `📋 *Tus datos fiscales:*\n` +
                  `RFC: ${usuario.rfc}\n` +
                  `Régimen: ${usuario.regimen_fiscal}\n` +
                  `Uso CFDI: ${usuario.uso_cfdi}`
              );
              continue;
            }

            if (text === "estado" || text === "status") {
              const { data: tickets } = await supabase
                .from("tickets")
                .select("comercio, total, status, created_at")
                .eq("usuario_id", usuario.id)
                .order("created_at", { ascending: false })
                .limit(5);

              if (!tickets || tickets.length === 0) {
                await sendWhatsAppText(from, "📋 No tienes tickets procesados aún.\n\nEnvía una foto de tu ticket para comenzar.");
              } else {
                const statusEmoji: Record<TicketStatus, string> = {
                  recibido: "📥",
                  esperando_confirmacion: "⏳",
                  en_cola_facturacion: "🔄",
                  facturado: "✅",
                  error: "❌",
                };
                const list = (tickets as Array<{ comercio: string; total: number; status: TicketStatus; created_at: string }>)
                  .map((t) => `${statusEmoji[t.status]} ${t.comercio} — $${t.total?.toFixed(2)} — ${t.status}`)
                  .join("\n");
                await sendWhatsAppText(from, `📊 *Tus últimos tickets:*\n\n${list}`);
              }
              continue;
            }

            await sendWhatsAppText(
              from,
              `Hola ${usuario.nombre} 👋\n\n` +
                `Envíame una *foto de tu ticket* de compra para facturarlo automáticamente.\n\n` +
                `O escribe *menu* para ver opciones.`
            );
          }
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Webhook] Unhandled error:", msg);
  }
});

// ---------------------------------------------------------------------------
// GLOBAL ERROR HANDLER
// ---------------------------------------------------------------------------
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Express] Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// ---------------------------------------------------------------------------
async function shutdown(): Promise<void> {
  console.log("[Shutdown] Closing workers and queues...");
  await Promise.allSettled([
    ticketProcessingWorker.close(),
    billingExecutionWorker.close(),
    ticketProcessingQueue.close(),
    billingExecutionQueue.close(),
  ]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// ---------------------------------------------------------------------------
// START SERVER
// ---------------------------------------------------------------------------
const PORT = Number(process.env.APP_PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`[Server] FacturaBot MX running on port ${PORT}`);
  console.log(`[Workers] ticket-processing and billing-execution workers active`);
});

export default app;
