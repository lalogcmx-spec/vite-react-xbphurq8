import path from "path";
import fs from "fs/promises";
import os from "os";
import {
  createBrowser,
  createStealthPage,
  log,
  saveDebugArtifact,
  runStage,
  StageContext,
} from "../drivers/visionEngine";
import { alertAdminOnFailure } from "../drivers/adminAlert";
import { logAutomationEvent } from "../drivers/observability";

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
const COMERCIO = "OXXO";
const OXXO_FACTURACION_URL = "https://factura.oxxo.com/";
const FAST_PATH_SELECTOR_TIMEOUT_MS = 4_000;

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

  const startedAt = Date.now();
  await logAutomationEvent({ ticketId: ticket.id, comercio: COMERCIO, status: "started" });

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `facturabot-oxxo-${ticket.id}-`));
  const browser = await createBrowser();
  const ctx: StageContext = { comercio: COMERCIO, ticketId: ticket.id, workDir };
  let usedVisionAnyStage = false;

  try {
    const page = await createStealthPage(browser);

    // -------------------------------------------------------------------
    // STAGE 0: Navigate
    // -------------------------------------------------------------------
    log(COMERCIO, ticket.id, "navigate", `Navegando a ${OXXO_FACTURACION_URL}`);
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
    const stage2 = await runStage(
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
    usedVisionAnyStage ||= stage2.usedVision;

    // -------------------------------------------------------------------
    // STAGE 3: Fill fiscal data (RFC, nombre, régimen, uso CFDI, correo)
    // -------------------------------------------------------------------
    const stage3 = await runStage(
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
    usedVisionAnyStage ||= stage3.usedVision;

    await saveDebugArtifact(page, workDir, "post-facturacion-success");

    // -------------------------------------------------------------------
    // STAGE 4: Download XML and PDF
    // -------------------------------------------------------------------
    log(COMERCIO, ticket.id, "descarga", "Descargando XML y PDF");

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

      const stageXml = await runStage(
        page,
        ctx,
        "descarga-xml-vision",
        "Encuentra y da clic en el enlace o botón para descargar el archivo XML de la factura.",
        async () => false,
        async () => visionCapturedXml
      ).catch(() => ({ usedVision: true }));
      usedVisionAnyStage ||= stageXml.usedVision;

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
      log(COMERCIO, ticket.id, "descarga", "Link de PDF no encontrado, generando desde la página actual");
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

    log(COMERCIO, ticket.id, "completado", `XML: ${xmlPath}, PDF: ${pdfPath}`);
    await logAutomationEvent({
      ticketId: ticket.id,
      comercio: COMERCIO,
      status: "success",
      durationMs: Date.now() - startedAt,
      usedVisionFallback: usedVisionAnyStage,
    });
    return { xmlPath, pdfPath };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log(COMERCIO, ticket.id, "error-fatal", msg);
    await alertAdminOnFailure(COMERCIO, ticket, msg);
    await logAutomationEvent({
      ticketId: ticket.id,
      comercio: COMERCIO,
      status: "error",
      durationMs: Date.now() - startedAt,
      errorMessage: msg,
      usedVisionFallback: usedVisionAnyStage,
    });
    throw new Error(`OXXO scraper: ${msg}`);
  } finally {
    await browser.close();
  }
}
