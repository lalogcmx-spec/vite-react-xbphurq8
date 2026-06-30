import { chromium, Browser, Page } from "playwright";
import path from "path";
import fs from "fs/promises";
import os from "os";
import axios from "axios";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// ---------------------------------------------------------------------------
// TYPES (inline to keep scraper self-contained)
// ---------------------------------------------------------------------------
interface Ticket {
  id: string;
  usuario_id: string;
  status: string;
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

interface Usuario {
  id: string;
  whatsapp_number: string;
  nombre: string;
  rfc: string;
  correo: string;
  regimen_fiscal: string;
  uso_cfdi: string;
  created_at: string;
}

interface FacturacionResult {
  xmlPath: string;
  pdfPath: string;
}

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const OXXO_FACTURACION_URL = "https://factura.oxxo.com/";
const TIMEOUT_MS = 45_000;
const NAVIGATION_TIMEOUT_MS = 90_000;
const FAST_PATH_SELECTOR_TIMEOUT_MS = 4_000;
const MAX_VISION_STEPS_PER_STAGE = 8;
const MAX_STAGE_RETRIES = 3;
const VISION_MODEL = "gpt-4o-mini";

// ---------------------------------------------------------------------------
// OPENAI CLIENT (vision fallback)
// ---------------------------------------------------------------------------
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ---------------------------------------------------------------------------
// ZOD SCHEMA — vision-guided action decision
// ---------------------------------------------------------------------------
const VisionActionSchema = z.object({
  reasoning: z
    .string()
    .describe("Breve análisis de qué se ve en pantalla y por qué se elige esta acción"),
  action: z
    .enum(["click", "type", "select", "wait", "scroll", "done", "blocked"])
    .describe(
      "click: clic en coordenadas. type: escribir texto (requiere click previo o coordenadas). " +
        "select: elegir opción de un <select> visible. wait: esperar más tiempo a que cargue. " +
        "scroll: bajar la página. done: la etapa actual ya se completó. " +
        "blocked: hay un captcha, error fatal, o bloqueo que un humano debe resolver."
    ),
  x: z.number().describe("Coordenada X del centro del elemento objetivo (0 si no aplica)"),
  y: z.number().describe("Coordenada Y del centro del elemento objetivo (0 si no aplica)"),
  textToType: z.string().describe("Texto a escribir si action es 'type', vacío si no aplica"),
  selectValue: z
    .string()
    .describe("Valor a seleccionar si action es 'select', vacío si no aplica"),
  blockedReason: z
    .string()
    .describe("Si action es 'blocked', explica qué impide continuar; vacío si no aplica"),
});

type VisionAction = z.infer<typeof VisionActionSchema>;

// ---------------------------------------------------------------------------
// BROWSER FACTORY
// ---------------------------------------------------------------------------
async function createBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1366,900",
      "--disable-blink-features=AutomationControlled",
      "--disable-extensions",
      "--disable-infobars",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-client-side-phishing-detection",
      "--disable-default-apps",
      "--disable-hang-monitor",
      "--disable-popup-blocking",
      "--disable-prompt-on-repost",
      "--disable-renderer-backgrounding",
      "--disable-sync",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--safebrowsing-disable-auto-update",
    ],
  });
}

async function createStealthPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    extraHTTPHeaders: {
      "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    },
  });

  await context.addInitScript(`
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
  `);

  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);
  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
  return page;
}

// ---------------------------------------------------------------------------
// LOGGING — runs unattended at 2am, so every step must be traceable
// ---------------------------------------------------------------------------
function log(ticketId: string, stage: string, msg: string): void {
  console.log(`[OXXO][${ticketId}][${stage}] ${msg}`);
}

async function saveDebugArtifact(
  page: Page,
  workDir: string,
  label: string
): Promise<{ screenshotPath: string; htmlPath: string }> {
  const debugDir = path.join(workDir, "debug");
  await fs.mkdir(debugDir, { recursive: true });
  const screenshotPath = path.join(debugDir, `${Date.now()}-${label}.png`);
  const htmlPath = path.join(debugDir, `${Date.now()}-${label}.html`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const html = await page.content();
  await fs.writeFile(htmlPath, html, "utf-8");
  return { screenshotPath, htmlPath };
}

// ---------------------------------------------------------------------------
// VISION-GUIDED ACTION: ask GPT-4o what to click/type given a screenshot
// ---------------------------------------------------------------------------
async function askVisionForNextAction(
  page: Page,
  goalDescription: string,
  history: string[]
): Promise<VisionAction> {
  const screenshotBuffer = await page.screenshot({ fullPage: false });
  const base64 = screenshotBuffer.toString("base64");

  const completion = await openai.beta.chat.completions.parse({
    model: VISION_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Eres un agente de automatización web que opera un navegador headless sin supervisión humana, " +
          "de madrugada, sobre el portal de facturación de OXXO México. " +
          "Recibes un screenshot del viewport actual (1366x900) y debes decidir la SIGUIENTE acción única " +
          "para avanzar hacia el objetivo. Sé conservador: si no estás seguro de qué hacer, usa 'wait'. " +
          "Si detectas un captcha, un bloqueo de seguridad, o un error que un script no puede resolver, " +
          "usa 'blocked' y explica por qué. Las coordenadas x,y deben ser el centro del elemento, " +
          "en píxeles relativos al viewport visible (no a la página completa).",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `OBJETIVO ACTUAL: ${goalDescription}\n\n` +
              `HISTORIAL DE ACCIONES PREVIAS (más reciente al final):\n` +
              (history.length > 0 ? history.join("\n") : "(ninguna aún)") +
              `\n\nAnaliza el screenshot adjunto y decide la siguiente acción.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${base64}`, detail: "high" },
          },
        ],
      },
    ],
    response_format: zodResponseFormat(VisionActionSchema, "vision_action"),
    max_tokens: 600,
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    throw new Error("GPT Vision no devolvió una acción estructurada válida");
  }
  return parsed;
}

async function executeVisionAction(page: Page, action: VisionAction): Promise<void> {
  switch (action.action) {
    case "click":
      await page.mouse.click(action.x, action.y);
      await page.waitForTimeout(800);
      break;
    case "type":
      await page.mouse.click(action.x, action.y);
      await page.waitForTimeout(200);
      await page.keyboard.type(action.textToType, { delay: 40 + Math.random() * 60 });
      await page.waitForTimeout(300);
      break;
    case "select": {
      // Runs inside the browser context — document/HTMLSelectElement exist there, not in Node
      await page.evaluate(
        `(() => {
          const elAtPoint = document.elementFromPoint(${action.x}, ${action.y});
          const selectEl = elAtPoint && elAtPoint.closest("select");
          if (selectEl) {
            selectEl.value = ${JSON.stringify(action.selectValue)};
            selectEl.dispatchEvent(new Event("change", { bubbles: true }));
          }
        })()`
      );
      await page.waitForTimeout(500);
      break;
    }
    case "scroll":
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(500);
      break;
    case "wait":
      await page.waitForTimeout(2500);
      break;
    case "done":
    case "blocked":
      break;
  }
}

// ---------------------------------------------------------------------------
// STAGE RUNNER: tries fast CSS-selector path first, falls back to vision
// loop, retries the whole stage up to MAX_STAGE_RETRIES times.
// ---------------------------------------------------------------------------
interface StageContext {
  ticketId: string;
  workDir: string;
}

async function runStage(
  page: Page,
  ctx: StageContext,
  stageName: string,
  goalDescription: string,
  fastPath: () => Promise<boolean>,
  isComplete: () => Promise<boolean>
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_STAGE_RETRIES; attempt++) {
    log(ctx.ticketId, stageName, `Intento ${attempt}/${MAX_STAGE_RETRIES}`);

    try {
      const fastPathWorked = await fastPath();
      if (fastPathWorked && (await isComplete())) {
        log(ctx.ticketId, stageName, "Completado vía selectores rápidos");
        return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(ctx.ticketId, stageName, `Fast path falló: ${msg}. Cayendo a GPT Vision.`);
    }

    if (await isComplete()) {
      log(ctx.ticketId, stageName, "Ya estaba completado antes de usar visión");
      return;
    }

    log(ctx.ticketId, stageName, "Activando modo GPT Vision (auto-recuperación)");
    const history: string[] = [];

    for (let step = 1; step <= MAX_VISION_STEPS_PER_STAGE; step++) {
      const action = await askVisionForNextAction(page, goalDescription, history);
      log(
        ctx.ticketId,
        stageName,
        `Vision step ${step}: ${action.action} @ (${action.x},${action.y}) — ${action.reasoning}`
      );

      if (action.action === "blocked") {
        await saveDebugArtifact(page, ctx.workDir, `${stageName}-blocked`);
        throw new Error(
          `OXXO bloqueó la automatización en etapa "${stageName}": ${action.blockedReason}`
        );
      }

      if (action.action === "done") {
        if (await isComplete()) {
          log(ctx.ticketId, stageName, "Completado vía GPT Vision");
          return;
        }
        history.push(`Paso ${step}: GPT dijo 'done' pero la validación de etapa aún no pasa.`);
        continue;
      }

      await executeVisionAction(page, action);
      history.push(`Paso ${step}: ${action.action} (${action.reasoning})`);

      if (await isComplete()) {
        log(ctx.ticketId, stageName, `Completado vía GPT Vision tras ${step} pasos`);
        return;
      }
    }

    await saveDebugArtifact(page, ctx.workDir, `${stageName}-attempt${attempt}-exhausted`);
    log(
      ctx.ticketId,
      stageName,
      `Se agotaron los ${MAX_VISION_STEPS_PER_STAGE} pasos de visión sin completar la etapa`
    );
  }

  throw new Error(
    `No se pudo completar la etapa "${stageName}" tras ${MAX_STAGE_RETRIES} intentos (selectores + visión)`
  );
}

// ---------------------------------------------------------------------------
// ALERTA A HUMANO — si todo falla a las 2am, alguien debe enterarse
// ---------------------------------------------------------------------------
async function alertAdminOnFailure(ticket: Ticket, errorMsg: string): Promise<void> {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!adminNumber || !process.env.META_ACCESS_TOKEN || !process.env.META_PHONE_NUMBER_ID) {
    console.error(
      `[OXXO] No se configuró ADMIN_WHATSAPP_NUMBER; no se pudo alertar sobre el fallo del ticket ${ticket.id}`
    );
    return;
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: adminNumber,
        type: "text",
        text: {
          preview_url: false,
          body:
            `🚨 *FacturaBot MX — Fallo en OXXO*\n\n` +
            `Ticket: ${ticket.id}\n` +
            `Folio: ${ticket.numero_ticket}\n` +
            `Total: $${ticket.total}\n\n` +
            `Error: ${errorMsg}\n\n` +
            `El driver agotó selectores + GPT Vision. Revisa los artefactos de debug en el servidor.`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (alertErr: unknown) {
    const msg = alertErr instanceof Error ? alertErr.message : String(alertErr);
    console.error(`[OXXO] No se pudo enviar alerta al admin: ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// OXXO FACTURACIÓN FLOW — hybrid selector + vision driver
// ---------------------------------------------------------------------------
export async function ejecutarFacturacion(
  ticket: Ticket,
  usuario: Usuario
): Promise<FacturacionResult> {
  if (!ticket.numero_ticket) throw new Error("Número de ticket faltante");
  if (!ticket.fecha) throw new Error("Fecha del ticket faltante");
  if (!ticket.total) throw new Error("Total del ticket faltante");
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no configurada — requerida para el fallback de GPT Vision");
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `facturabot-oxxo-${ticket.id}-`));
  const browser = await createBrowser();
  const ctx: StageContext = { ticketId: ticket.id, workDir };

  try {
    const page = await createStealthPage(browser);

    // -------------------------------------------------------------------
    // STAGE 0: Navigate
    // -------------------------------------------------------------------
    log(ticket.id, "navigate", `Navegando a ${OXXO_FACTURACION_URL}`);
    await page.goto(OXXO_FACTURACION_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // -------------------------------------------------------------------
    // STAGE 1: Cookie banner (best-effort, non-blocking)
    // -------------------------------------------------------------------
    try {
      const cookieBtn = page.locator(
        'button:has-text("Aceptar"), button:has-text("Accept"), #onetrust-accept-btn-handler'
      );
      if (await cookieBtn.isVisible({ timeout: 3_000 })) {
        await cookieBtn.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // Optional banner — ignore if absent
    }

    // -------------------------------------------------------------------
    // STAGE 2: Fill ticket search form (folio + total + fecha)
    // -------------------------------------------------------------------
    await runStage(
      page,
      ctx,
      "buscar-ticket",
      `Localiza el formulario de búsqueda de ticket y llena: número de folio/referencia = "${ticket.numero_ticket}", ` +
        `total de la compra = "${ticket.total!.toFixed(2)}", fecha = "${ticket.fecha}". ` +
        `Luego da clic en el botón de buscar/continuar. El objetivo se considera cumplido cuando aparece ` +
        `un formulario pidiendo datos fiscales (RFC, razón social) o un mensaje de error de ticket no encontrado.`,
      async () => {
        const folioInput = page.locator(
          'input[name*="folio" i], input[id*="folio" i], input[placeholder*="folio" i], ' +
            'input[name*="ticket" i], input[id*="ticket" i], input[placeholder*="referencia" i]'
        );
        if (!(await folioInput.first().isVisible({ timeout: FAST_PATH_SELECTOR_TIMEOUT_MS }))) {
          return false;
        }
        await folioInput.first().fill(ticket.numero_ticket!);

        const totalInput = page.locator(
          'input[name*="total" i], input[id*="total" i], input[placeholder*="total" i], ' +
            'input[name*="importe" i], input[placeholder*="importe" i]'
        );
        if (await totalInput.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          await totalInput.first().fill(ticket.total!.toFixed(2));
        }

        const fechaInput = page.locator('input[type="date"], input[name*="fecha" i]');
        if (await fechaInput.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          await fechaInput.first().fill(ticket.fecha!).catch(() => {});
        }

        const submitBtn = page.locator(
          'button[type="submit"], button:has-text("Buscar"), button:has-text("Continuar")'
        );
        if (await submitBtn.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          await submitBtn.first().click();
          await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
        }
        return true;
      },
      async () => {
        const pageText = (await page.textContent("body").catch(() => "")) ?? "";
        const lower = pageText.toLowerCase();
        if (lower.includes("no encontrado") || lower.includes("no existe") || lower.includes("inválido")) {
          throw new Error(`OXXO rechazó el ticket "${ticket.numero_ticket}": dato no encontrado en el portal`);
        }
        const rfcField = page.locator('input[name*="rfc" i], input[placeholder*="rfc" i]');
        return await rfcField.first().isVisible({ timeout: 1_000 }).catch(() => false);
      }
    );

    // -------------------------------------------------------------------
    // STAGE 3: Fill fiscal data (RFC, nombre, régimen, uso CFDI, correo)
    // -------------------------------------------------------------------
    await runStage(
      page,
      ctx,
      "datos-fiscales",
      `Llena el formulario de datos fiscales: RFC = "${usuario.rfc}", nombre/razón social = "${usuario.nombre}", ` +
        `correo = "${usuario.correo}", régimen fiscal SAT = "${usuario.regimen_fiscal}", ` +
        `uso de CFDI = "${usuario.uso_cfdi}". Si hay un botón de buscar/validar RFC, dale clic primero. ` +
        `Luego da clic en el botón de generar/solicitar factura. El objetivo se cumple cuando aparece ` +
        `una pantalla de confirmación, descarga, o un mensaje de "factura generada".`,
      async () => {
        const rfcInput = page.locator('input[name*="rfc" i], input[placeholder*="rfc" i]');
        if (!(await rfcInput.first().isVisible({ timeout: FAST_PATH_SELECTOR_TIMEOUT_MS }))) {
          return false;
        }
        await rfcInput.first().fill(usuario.rfc);

        const rfcSearchBtn = page.locator(
          'button:has-text("Buscar RFC"), button:has-text("Validar"), button:has-text("Verificar")'
        );
        if (await rfcSearchBtn.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          await rfcSearchBtn.first().click();
          await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
        }

        const nombreInput = page.locator(
          'input[name*="nombre" i], input[name*="razon" i], input[placeholder*="nombre" i], input[placeholder*="razón" i]'
        );
        if (await nombreInput.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          const current = await nombreInput.first().inputValue().catch(() => "");
          if (!current) await nombreInput.first().fill(usuario.nombre);
        }

        const correoInput = page.locator(
          'input[type="email"], input[name*="correo" i], input[name*="email" i], input[placeholder*="correo" i]'
        );
        if (await correoInput.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          await correoInput.first().fill(usuario.correo);
        }

        const regimenSelect = page.locator(
          'select[name*="regimen" i], select[id*="regimen" i]'
        );
        if (await regimenSelect.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          await regimenSelect.first().selectOption({ value: usuario.regimen_fiscal }).catch(() => {});
        }

        const cfdiSelect = page.locator('select[name*="cfdi" i], select[id*="cfdi" i], select[name*="uso" i]');
        if (await cfdiSelect.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          await cfdiSelect.first().selectOption({ value: usuario.uso_cfdi }).catch(() => {});
        }

        const facturarBtn = page.locator(
          'button:has-text("Facturar"), button:has-text("Generar Factura"), button:has-text("Solicitar Factura")'
        );
        if (await facturarBtn.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
          await facturarBtn.first().click();
          await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
        }
        return true;
      },
      async () => {
        const pageText = ((await page.textContent("body").catch(() => "")) ?? "").toLowerCase();
        if (pageText.includes("ya fue facturado") || pageText.includes("no fue posible")) {
          throw new Error("OXXO reportó un error de facturación irreversible para este ticket");
        }
        const hasDownloadLink = await page
          .locator('a[href*=".xml"], a[href*=".pdf"], a:has-text("Descargar")')
          .first()
          .isVisible({ timeout: 1_000 })
          .catch(() => false);
        return hasDownloadLink || pageText.includes("factura generada") || pageText.includes("éxito");
      }
    );

    await saveDebugArtifact(page, workDir, "post-facturacion-success");

    // -------------------------------------------------------------------
    // STAGE 4: Download XML and PDF
    // -------------------------------------------------------------------
    log(ticket.id, "descarga", "Descargando XML y PDF");

    let xmlPath = path.join(workDir, "factura.xml");
    let pdfPath = path.join(workDir, "factura.pdf");
    let xmlDownloaded = false;
    let pdfDownloaded = false;

    const downloadViaLink = async (
      selectors: string[],
      destPath: string
    ): Promise<boolean> => {
      for (const sel of selectors) {
        try {
          const link = page.locator(sel).first();
          if (await link.isVisible({ timeout: 4_000 })) {
            const [download] = await Promise.all([
              page.waitForEvent("download", { timeout: 30_000 }),
              link.click(),
            ]);
            await download.saveAs(destPath);
            return true;
          }
        } catch {
          continue;
        }
      }
      return false;
    };

    xmlDownloaded = await downloadViaLink(
      ['a:has-text("XML")', 'a[href*=".xml"]', 'a[download*="xml" i]'],
      xmlPath
    );

    if (!xmlDownloaded) {
      // Fallback: fetch directly via href if a link exists but didn't trigger a download event
      try {
        const href = await page.locator('a[href*=".xml"]').first().getAttribute("href");
        if (href) {
          const xmlUrl = href.startsWith("http") ? href : new URL(href, page.url()).toString();
          const response = await page.request.get(xmlUrl);
          await fs.writeFile(xmlPath, await response.text(), "utf-8");
          xmlDownloaded = true;
        }
      } catch {
        // fall through to vision-assisted retry below
      }
    }

    if (!xmlDownloaded) {
      // Last resort: ask vision to find and click the XML download element.
      // A 'download' listener is attached BEFORE the vision loop so that any
      // click it makes that triggers a real browser download gets captured —
      // executeVisionAction() only performs the click, it does not itself
      // await the download event.
      let visionCapturedXml = false;
      const onDownload = async (download: import("playwright").Download): Promise<void> => {
        try {
          await download.saveAs(xmlPath);
          visionCapturedXml = true;
        } catch {
          // ignore — checked via isComplete below
        }
      };
      page.on("download", onDownload);

      await runStage(
        page,
        ctx,
        "descarga-xml-vision",
        "Encuentra y da clic en el enlace o botón para descargar el archivo XML de la factura.",
        async () => false,
        async () => visionCapturedXml
      ).catch(() => {
        // runStage throws after exhausting retries; final failure handled below
      });

      page.off("download", onDownload);
      xmlDownloaded = visionCapturedXml && (await fs.stat(xmlPath).then(() => true).catch(() => false));
    }

    if (!xmlDownloaded) {
      await saveDebugArtifact(page, workDir, "xml-download-failed");
      throw new Error("No se pudo descargar el XML de la factura desde el portal de OXXO");
    }

    pdfDownloaded = await downloadViaLink(
      ['a:has-text("PDF")', 'a[href*=".pdf"]', 'a[download*="pdf" i]'],
      pdfPath
    );

    if (!pdfDownloaded) {
      log(ticket.id, "descarga", "Link de PDF no encontrado, generando desde la página actual");
      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
      });
      pdfDownloaded = true;
    }

    // -------------------------------------------------------------------
    // STAGE 5: Validate downloaded files
    // -------------------------------------------------------------------
    const [xmlStat, pdfStat] = await Promise.all([fs.stat(xmlPath), fs.stat(pdfPath)]);
    if (xmlStat.size < 100) throw new Error("El XML descargado está vacío o es inválido");
    if (pdfStat.size < 1000) throw new Error("El PDF descargado está vacío o es inválido");

    const xmlContent = await fs.readFile(xmlPath, "utf-8");
    if (!xmlContent.includes("Comprobante")) {
      throw new Error("El XML descargado no corresponde a un CFDI válido del SAT");
    }

    log(ticket.id, "completado", `XML: ${xmlPath}, PDF: ${pdfPath}`);
    return { xmlPath, pdfPath };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log(ticket.id, "error-fatal", msg);
    await alertAdminOnFailure(ticket, msg);
    throw new Error(`OXXO scraper: ${msg}`);
  } finally {
    await browser.close();
  }
}
