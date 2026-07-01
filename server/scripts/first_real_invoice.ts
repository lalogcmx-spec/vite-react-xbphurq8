/**
 * scripts/first_real_invoice.ts
 *
 * Script standalone para correr el flujo completo UNA SOLA VEZ desde la
 * línea de comandos, sin pasar por WhatsApp ni BullMQ — útil para la
 * primera prueba real del sistema, donde quieres ver cada paso y cada
 * error directamente en la terminal.
 *
 * foto.jpg → OCR → detect merchant → ejecuta driver → descarga XML/PDF
 *
 * Requiere server/.env con credenciales REALES (no placeholders):
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY
 *   y, si vas a probar OXXO/Costco, nada adicional;
 *   si vas a probar Walmart/Starbucks/Zara, además MERCHANT_PORTAL_<NOMBRE>.
 *
 * Uso:
 *   cd server
 *   npx tsx scripts/first_real_invoice.ts /ruta/a/foto.jpg --rfc=XAXX010101000 \
 *     --nombre="Juan Pérez" --correo=juan@example.com
 *
 * Este script NO escribe en la tabla "usuarios" — usa los datos fiscales
 * que pasas por línea de comandos para construir un objeto Usuario en
 * memoria. Si quieres probar contra un usuario real ya registrado en
 * Supabase, pasa --usuarioId=<uuid> en vez de --rfc/--nombre/--correo y el
 * script lo busca en la base de datos.
 */
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { resolveDriver, listRegisteredMerchants } from "../src/drivers/registry";
import { getGeminiModel, extractJson } from "../src/lib/geminiClient";

// ---------------------------------------------------------------------------
// Mismo schema de extracción que usa server/src/app.ts (duplicado a
// propósito: app.ts no exporta sus funciones internas, y este script debe
// poder correr de forma aislada sin levantar el servidor completo).
// ---------------------------------------------------------------------------
const TicketExtractionSchema = z.object({
  comercio: z.string().describe("Nombre del comercio tal como aparece en el ticket"),
  rfcEmisor: z.string().describe("RFC del emisor del ticket, 12 o 13 caracteres"),
  fecha: z.string().describe("Fecha de la compra en formato YYYY-MM-DD"),
  hora: z.string().describe("Hora de la compra en formato HH:MM:SS"),
  numeroTicket: z.string().describe("Número de folio o ticket de la compra"),
  subtotal: z.number().describe("Subtotal antes de impuestos en pesos MXN"),
  iva: z.number().describe("Monto del IVA en pesos MXN"),
  total: z.number().describe("Total de la compra en pesos MXN"),
  formaPago: z.string().describe("Forma de pago: EFECTIVO, TARJETA_CREDITO, TARJETA_DEBITO, TRANSFERENCIA"),
});

function parseArgs(argv: string[]) {
  const positional = argv.filter((a) => !a.startsWith("--"));
  const flags: Record<string, string> = {};
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, ...rest] = a.slice(2).split("=");
      flags[k] = rest.join("=");
    }
  }
  return { imagePath: positional[0], flags };
}

async function main() {
  const { imagePath, flags } = parseArgs(process.argv.slice(2));
  if (!imagePath) {
    console.error("Uso: npx tsx scripts/first_real_invoice.ts /ruta/a/foto.jpg --rfc=... --nombre=... --correo=...");
    process.exit(1);
  }

  for (const key of ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "GEMINI_API_KEY"] as const) {
    if (!process.env[key] || process.env[key]!.includes("TU_")) {
      console.error(`[BOOT] ${key} falta o sigue siendo un placeholder en server/.env`);
      process.exit(1);
    }
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  // -------------------------------------------------------------------
  // PASO 1: OCR — leer el ticket
  // -------------------------------------------------------------------
  console.log(`[1/5] Leyendo imagen: ${imagePath}`);
  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

  console.log("[2/5] Extrayendo datos del ticket con Gemini (OCR estructurado)...");
  const model = getGeminiModel();
  const prompt =
    "Eres un asistente especializado en leer tickets de compra mexicanos. " +
    "Extrae con precisión los datos solicitados. " +
    "Si un campo no está visible, usa cadena vacía o 0 según corresponda. " +
    "Las fechas siempre en formato YYYY-MM-DD y horas en HH:MM:SS.\n\n" +
    "Extrae todos los datos de este ticket de compra mexicano y responde " +
    "ÚNICAMENTE con un objeto JSON con esta forma exacta (sin texto adicional, sin markdown):\n" +
    `{"comercio": string, "rfcEmisor": string, "fecha": string, "hora": string, ` +
    `"numeroTicket": string, "subtotal": number, "iva": number, "total": number, "formaPago": string}`;

  const result = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Image } }] },
    ],
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1000 },
  });

  const text = result.response.text();
  let rawJson: unknown;
  try {
    rawJson = extractJson(text);
  } catch {
    throw new Error(`Gemini no devolvió JSON válido al leer el ticket: ${text.slice(0, 300)}`);
  }
  const parsedExtraction = TicketExtractionSchema.safeParse(rawJson);
  if (!parsedExtraction.success) {
    throw new Error(`Gemini devolvió datos que no cumplen el schema esperado: ${parsedExtraction.error.message}`);
  }
  const extraction = parsedExtraction.data;
  console.log("    Comercio detectado:", extraction.comercio);
  console.log("    Total:", extraction.total);
  console.log("    Folio:", extraction.numeroTicket);

  // -------------------------------------------------------------------
  // PASO 2: Detectar el driver del comercio (Merchant Intelligence Engine)
  // -------------------------------------------------------------------
  console.log("[3/5] Resolviendo driver para el comercio detectado...");
  const driverEntry = resolveDriver(extraction.comercio);
  if (!driverEntry) {
    console.error(
      `No hay driver registrado para "${extraction.comercio}". ` +
        `Comercios soportados: ${listRegisteredMerchants().map((m) => m.comercio).join(", ")}`
    );
    process.exit(1);
  }
  console.log(`    Driver: ${driverEntry.comercio} (verified: ${driverEntry.verified})`);

  // -------------------------------------------------------------------
  // PASO 3: Construir el Usuario (desde Supabase o desde flags)
  // -------------------------------------------------------------------
  let usuario: { id: string; nombre: string; rfc: string; correo: string; regimen_fiscal: string; uso_cfdi: string };
  if (flags.usuarioId) {
    const { data, error } = await supabase.from("usuarios").select("*").eq("id", flags.usuarioId).single();
    if (error || !data) throw new Error(`No se encontró el usuario ${flags.usuarioId} en Supabase: ${error?.message}`);
    usuario = data;
  } else {
    if (!flags.rfc || !flags.nombre || !flags.correo) {
      console.error("Falta --usuarioId=<uuid> o bien --rfc, --nombre y --correo");
      process.exit(1);
    }
    usuario = {
      id: randomUUID(),
      nombre: flags.nombre,
      rfc: flags.rfc,
      correo: flags.correo,
      regimen_fiscal: flags.regimen ?? "626",
      uso_cfdi: flags.usoCfdi ?? "G03",
    };
  }

  // -------------------------------------------------------------------
  // PASO 4: Crear el registro de ticket en Supabase (para que el driver
  // y la cache de selectores/observabilidad tengan un ticket_id real)
  // -------------------------------------------------------------------
  console.log("[4/5] Creando fila de ticket en Supabase...");
  const { data: ticketRow, error: ticketErr } = await supabase
    .from("tickets")
    .insert({
      usuario_id: flags.usuarioId ?? null,
      status: "en_cola_facturacion",
      comercio: extraction.comercio,
      rfc_emisor: extraction.rfcEmisor,
      fecha: extraction.fecha,
      hora: extraction.hora,
      numero_ticket: extraction.numeroTicket,
      subtotal: extraction.subtotal,
      iva: extraction.iva,
      total: extraction.total,
      forma_pago: extraction.formaPago,
    })
    .select()
    .single();

  if (ticketErr || !ticketRow) {
    throw new Error(
      `No se pudo crear el ticket en Supabase: ${ticketErr?.message}. ` +
        `¿Ya ejecutaste el SQL de las tablas (.env.example)? ` +
        `¿usuario_id=${flags.usuarioId ?? "null"} existe en la tabla usuarios (FK)?`
    );
  }
  console.log(`    Ticket creado: ${ticketRow.id}`);

  // -------------------------------------------------------------------
  // PASO 5: Ejecutar el driver — esta es la parte que toca un sitio real
  // -------------------------------------------------------------------
  console.log(`[5/5] Ejecutando driver de ${driverEntry.comercio}... (esto abre Chromium headless)`);
  const driver = await driverEntry.load();
  try {
    const { xmlPath, pdfPath } = await driver.ejecutarFacturacion(ticketRow, usuario);
    console.log("✅ Factura generada:");
    console.log("    XML:", xmlPath);
    console.log("    PDF:", pdfPath);

    await supabase.from("tickets").update({ status: "facturado" }).eq("id", ticketRow.id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Falló la facturación:", msg);
    await supabase.from("tickets").update({ status: "error", error_message: msg }).eq("id", ticketRow.id);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
