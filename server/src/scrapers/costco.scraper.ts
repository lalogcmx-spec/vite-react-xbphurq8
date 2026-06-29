import { chromium, Browser, Page } from "playwright";
import path from "path";
import fs from "fs/promises";
import os from "os";

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
const COSTCO_FACTURACION_URL = "https://www.costco.com.mx/facturacion";
const TIMEOUT_MS = 60_000;
const NAVIGATION_TIMEOUT_MS = 90_000;

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
      "--window-size=1280,800",
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

// ---------------------------------------------------------------------------
// PAGE FACTORY with anti-detection headers
// ---------------------------------------------------------------------------
async function createStealthPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    extraHTTPHeaders: {
      "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  });

  // Script runs in the browser (not Node), so navigator/window exist there
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
// HELPER: type slowly like a human
// ---------------------------------------------------------------------------
async function humanType(page: Page, selector: string, text: string): Promise<void> {
  await page.click(selector);
  await page.fill(selector, "");
  for (const char of text) {
    await page.keyboard.type(char, { delay: 30 + Math.random() * 70 });
  }
}

// ---------------------------------------------------------------------------
// HELPER: safe screenshot for debugging
// ---------------------------------------------------------------------------
async function debugScreenshot(page: Page, label: string): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    const screenshotDir = path.join(os.tmpdir(), "facturabot-debug");
    await fs.mkdir(screenshotDir, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDir, `${Date.now()}-${label}.png`),
      fullPage: true,
    });
  }
}

// ---------------------------------------------------------------------------
// HELPER: wait for download via page.waitForEvent
// ---------------------------------------------------------------------------
async function waitForDownload(
  page: Page,
  triggerAction: () => Promise<void>,
  downloadDir: string
): Promise<string> {
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 60_000 }),
    triggerAction(),
  ]);

  const suggestedName = download.suggestedFilename() || `descarga_${Date.now()}`;
  const filePath = path.join(downloadDir, suggestedName);
  await download.saveAs(filePath);
  return filePath;
}

// ---------------------------------------------------------------------------
// COSTCO FACTURACIÓN FLOW
// ---------------------------------------------------------------------------
export async function ejecutarFacturacion(
  ticket: Ticket,
  usuario: Usuario
): Promise<FacturacionResult> {
  if (!ticket.numero_ticket) throw new Error("Número de ticket faltante");
  if (!ticket.fecha) throw new Error("Fecha del ticket faltante");
  if (!ticket.total) throw new Error("Total del ticket faltante");

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `facturabot-${ticket.id}-`));
  const browser = await createBrowser();

  try {
    const page = await createStealthPage(browser);

    // -----------------------------------------------------------------------
    // STEP 1: Navigate to Costco Facturación portal
    // -----------------------------------------------------------------------
    console.log(`[Costco] Navigating to ${COSTCO_FACTURACION_URL}`);
    await page.goto(COSTCO_FACTURACION_URL, { waitUntil: "domcontentloaded" });
    await debugScreenshot(page, "01-landing");

    // Accept cookies if banner appears
    try {
      const cookieBtn = page.locator(
        'button:has-text("Aceptar"), button:has-text("Accept"), #onetrust-accept-btn-handler'
      );
      if (await cookieBtn.isVisible({ timeout: 5_000 })) {
        await cookieBtn.click();
        await page.waitForTimeout(1_000);
      }
    } catch {
      // Cookie banner is optional
    }

    // -----------------------------------------------------------------------
    // STEP 2: Fill ticket search form
    // -----------------------------------------------------------------------
    console.log("[Costco] Filling ticket search form");

    // Costco MX facturación portal typically has a single form to enter
    // the ticket number and date. Selectors are based on the portal structure.
    await page.waitForSelector('input[name="folio"], input[id*="folio"], input[placeholder*="folio" i], input[placeholder*="ticket" i]', {
      timeout: TIMEOUT_MS,
    });

    const folioSelectors = [
      'input[name="folio"]',
      'input[id*="folio"]',
      'input[placeholder*="folio" i]',
      'input[placeholder*="ticket" i]',
      'input[id*="ticket"]',
    ];

    let folioSelector: string | null = null;
    for (const sel of folioSelectors) {
      try {
        if (await page.locator(sel).isVisible({ timeout: 3_000 })) {
          folioSelector = sel;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!folioSelector) {
      await debugScreenshot(page, "02-error-no-folio-input");
      throw new Error("No se encontró el campo de folio en el portal de Costco");
    }

    await humanType(page, folioSelector, ticket.numero_ticket);
    await debugScreenshot(page, "02-folio-filled");

    // Fill date field
    const dateSelectors = [
      'input[name="fecha"]',
      'input[type="date"]',
      'input[id*="fecha"]',
      'input[placeholder*="fecha" i]',
    ];

    for (const sel of dateSelectors) {
      try {
        if (await page.locator(sel).isVisible({ timeout: 3_000 })) {
          // Costco date format: DD/MM/YYYY
          const [year, month, day] = ticket.fecha!.split("-");
          const formattedDate = `${day}/${month}/${year}`;

          // Try filling as-is first, then try the ISO format
          try {
            await page.fill(sel, ticket.fecha!);
          } catch {
            await humanType(page, sel, formattedDate);
          }
          break;
        }
      } catch {
        continue;
      }
    }

    // Fill total if required by the portal
    const totalSelectors = [
      'input[name="total"]',
      'input[id*="total"]',
      'input[placeholder*="total" i]',
      'input[placeholder*="importe" i]',
    ];

    for (const sel of totalSelectors) {
      try {
        if (await page.locator(sel).isVisible({ timeout: 2_000 })) {
          await humanType(page, sel, ticket.total!.toFixed(2));
          break;
        }
      } catch {
        continue;
      }
    }

    await debugScreenshot(page, "03-ticket-data-filled");

    // Submit ticket search form
    const searchBtn = page.locator(
      'button[type="submit"], button:has-text("Buscar"), button:has-text("Continuar"), input[type="submit"]'
    );
    await searchBtn.first().click();

    await page.waitForLoadState("networkidle", { timeout: 30_000 });
    await debugScreenshot(page, "04-after-search");

    // Check for ticket not found error
    const errorMessages = [
      "ticket no encontrado",
      "no se encontró",
      "no existe",
      "datos incorrectos",
    ];
    const pageText = (await page.textContent("body") ?? "").toLowerCase();
    for (const errMsg of errorMessages) {
      if (pageText.includes(errMsg)) {
        throw new Error(
          `Costco rechazó el ticket: "${ticket.numero_ticket}". Verifica los datos e intenta de nuevo.`
        );
      }
    }

    // -----------------------------------------------------------------------
    // STEP 3: Fill fiscal data (RFC, nombre, regimen, uso CFDI)
    // -----------------------------------------------------------------------
    console.log("[Costco] Filling fiscal data");

    await page.waitForSelector(
      'input[name="rfc"], input[id*="rfc"], input[placeholder*="RFC" i]',
      { timeout: TIMEOUT_MS }
    );

    const rfcSelectors = [
      'input[name="rfc"]',
      'input[id*="rfc"]',
      'input[placeholder*="RFC" i]',
    ];

    for (const sel of rfcSelectors) {
      try {
        if (await page.locator(sel).isVisible({ timeout: 3_000 })) {
          await humanType(page, sel, usuario.rfc);
          break;
        }
      } catch {
        continue;
      }
    }

    // Search/validate RFC
    const rfcSearchBtn = page.locator(
      'button:has-text("Buscar RFC"), button:has-text("Validar"), button:has-text("Verificar RFC")'
    );
    if (await rfcSearchBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await rfcSearchBtn.click();
      await page.waitForLoadState("networkidle", { timeout: 15_000 });
    }

    // Fill nombre / razón social
    const nombreSelectors = [
      'input[name="nombre"]',
      'input[name="razonSocial"]',
      'input[id*="nombre"]',
      'input[id*="razon"]',
      'input[placeholder*="nombre" i]',
      'input[placeholder*="razón" i]',
    ];

    for (const sel of nombreSelectors) {
      try {
        const el = page.locator(sel);
        if (await el.isVisible({ timeout: 2_000 })) {
          const currentVal = await el.inputValue();
          // Only fill if empty (portal may auto-populate from RFC lookup)
          if (!currentVal) {
            await humanType(page, sel, usuario.nombre);
          }
          break;
        }
      } catch {
        continue;
      }
    }

    // Fill correo
    const correoSelectors = [
      'input[name="email"]',
      'input[name="correo"]',
      'input[type="email"]',
      'input[id*="email"]',
      'input[id*="correo"]',
      'input[placeholder*="correo" i]',
      'input[placeholder*="email" i]',
    ];

    for (const sel of correoSelectors) {
      try {
        if (await page.locator(sel).isVisible({ timeout: 2_000 })) {
          await humanType(page, sel, usuario.correo);
          break;
        }
      } catch {
        continue;
      }
    }

    // Select Régimen Fiscal from dropdown
    const regimenSelectors = [
      'select[name="regimenFiscal"]',
      'select[id*="regimen"]',
      'select[name="regimen"]',
    ];

    for (const sel of regimenSelectors) {
      try {
        if (await page.locator(sel).isVisible({ timeout: 2_000 })) {
          await page.selectOption(sel, { value: usuario.regimen_fiscal });
          break;
        }
      } catch {
        continue;
      }
    }

    // Select Uso CFDI from dropdown
    const cfdiSelectors = [
      'select[name="usoCfdi"]',
      'select[name="uso_cfdi"]',
      'select[id*="cfdi"]',
      'select[id*="uso"]',
    ];

    for (const sel of cfdiSelectors) {
      try {
        if (await page.locator(sel).isVisible({ timeout: 2_000 })) {
          await page.selectOption(sel, { value: usuario.uso_cfdi });
          break;
        }
      } catch {
        continue;
      }
    }

    await debugScreenshot(page, "05-fiscal-data-filled");

    // -----------------------------------------------------------------------
    // STEP 4: Submit facturación form
    // -----------------------------------------------------------------------
    console.log("[Costco] Submitting facturación form");

    const facturarBtn = page.locator(
      'button:has-text("Facturar"), button:has-text("Generar Factura"), ' +
        'button:has-text("Solicitar Factura"), input[value*="Facturar" i]'
    );
    await facturarBtn.first().click();

    await page.waitForLoadState("networkidle", { timeout: 60_000 });
    await debugScreenshot(page, "06-after-submit");

    // Check for submission errors
    const postSubmitText = (await page.textContent("body") ?? "").toLowerCase();
    const postSubmitErrors = [
      "error al generar",
      "no fue posible",
      "intente más tarde",
      "ya fue facturado",
    ];
    for (const errMsg of postSubmitErrors) {
      if (postSubmitText.includes(errMsg)) {
        throw new Error(`Error en portal Costco: ${errMsg}`);
      }
    }

    // -----------------------------------------------------------------------
    // STEP 5: Download XML and PDF
    // -----------------------------------------------------------------------
    console.log("[Costco] Downloading XML and PDF");

    let xmlPath = path.join(workDir, "factura.xml");
    let pdfPath = path.join(workDir, "factura.pdf");

    // Try download via links first
    const xmlLinkSelectors = [
      'a:has-text("Descargar XML")',
      'a:has-text("XML")',
      'a[href*=".xml"]',
      'a[download*="xml" i]',
    ];

    let xmlDownloaded = false;
    for (const sel of xmlLinkSelectors) {
      try {
        const link = page.locator(sel).first();
        if (await link.isVisible({ timeout: 5_000 })) {
          xmlPath = await waitForDownload(page, () => link.click(), workDir);
          xmlDownloaded = true;
          break;
        }
      } catch {
        continue;
      }
    }

    // If no direct link, try fetching XML from href attribute
    if (!xmlDownloaded) {
      for (const sel of xmlLinkSelectors) {
        try {
          const href = await page.locator(sel).first().getAttribute("href");
          if (href) {
            const xmlUrl = href.startsWith("http") ? href : `https://www.costco.com.mx${href}`;
            const response = await page.request.get(xmlUrl);
            const xmlContent = await response.text();
            await fs.writeFile(xmlPath, xmlContent, "utf-8");
            xmlDownloaded = true;
            break;
          }
        } catch {
          continue;
        }
      }
    }

    if (!xmlDownloaded) {
      await debugScreenshot(page, "07-error-no-xml");
      throw new Error("No se pudo descargar el XML de la factura desde el portal de Costco");
    }

    const pdfLinkSelectors = [
      'a:has-text("Descargar PDF")',
      'a:has-text("PDF")',
      'a[href*=".pdf"]',
      'a[download*="pdf" i]',
    ];

    let pdfDownloaded = false;
    for (const sel of pdfLinkSelectors) {
      try {
        const link = page.locator(sel).first();
        if (await link.isVisible({ timeout: 5_000 })) {
          pdfPath = await waitForDownload(page, () => link.click(), workDir);
          pdfDownloaded = true;
          break;
        }
      } catch {
        continue;
      }
    }

    // Fallback: generate PDF from current page using Playwright's built-in PDF
    if (!pdfDownloaded) {
      console.log("[Costco] PDF link not found, generating from page print");
      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
      });
      pdfDownloaded = true;
    }

    // Validate that files have content
    const [xmlStat, pdfStat] = await Promise.all([
      fs.stat(xmlPath),
      fs.stat(pdfPath),
    ]);

    if (xmlStat.size < 100) {
      throw new Error("El archivo XML descargado está vacío o es inválido");
    }
    if (pdfStat.size < 1000) {
      throw new Error("El archivo PDF descargado está vacío o es inválido");
    }

    // Validate XML structure (basic SAT CFDI check)
    const xmlContent = await fs.readFile(xmlPath, "utf-8");
    if (!xmlContent.includes("cfdi:Comprobante") && !xmlContent.includes("Comprobante")) {
      throw new Error("El XML descargado no corresponde a un CFDI válido del SAT");
    }

    console.log(`[Costco] Facturación completada. XML: ${xmlPath}, PDF: ${pdfPath}`);

    return { xmlPath, pdfPath };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Costco] Facturación falló para ticket ${ticket.id}:`, msg);
    // workDir cleanup is responsibility of the caller (billing worker)
    throw new Error(`Costco scraper: ${msg}`);
  } finally {
    await browser.close();
  }
}
