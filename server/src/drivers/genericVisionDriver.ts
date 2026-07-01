import path from "path";
import fs from "fs/promises";
import os from "os";
import { Page } from "playwright";
import {
  createBrowser,
  createStealthPage,
  log,
  saveDebugArtifact,
  runStage,
  StageContext,
} from "./visionEngine";
import { alertAdminOnFailure } from "./adminAlert";
import { logAutomationEvent } from "./observability";
import { getCachedSelector, saveCachedSelector, getSelectorAtPoint } from "./selectorCache";

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

export interface GenericMerchantConfig {
  comercio: string;
  // Nombre de la variable de entorno donde se configura la URL del portal
  // de autofacturación de este comercio. No adivinamos URLs: si no está
  // configurada, el driver falla explícitamente en vez de inventar una.
  portalUrlEnvVar: string;
}

// ---------------------------------------------------------------------------
// DRIVER GENÉRICO POR VISIÓN — para comercios sin selectores CSS conocidos
// (Walmart, Starbucks, Zara, Soriana, etc. en el MVP). Cada campo del
// formulario es su propia "etapa" de una sola acción, lo que permite
// cachear el selector exacto que Gemini Vision usó la primera vez y, en
// corridas futuras, rellenarlo directo sin volver a llamar a Vision —
// esto es el self-healing real: aprende un selector por campo y lo
// re-valida cada vez que falla, en vez de asumir que nunca cambia.
// ---------------------------------------------------------------------------
interface FieldSpec {
  key: string;
  goal: string;
  value: string;
  inputType: "text" | "select";
}

async function tryFillFromCache(
  page: Page,
  comercio: string,
  field: FieldSpec
): Promise<boolean> {
  const selector = await getCachedSelector(comercio, field.key);
  if (!selector) return false;
  try {
    const locator = page.locator(selector).first();
    if (!(await locator.isVisible({ timeout: 3_000 }))) return false;
    if (field.inputType === "select") {
      await locator.selectOption({ value: field.value });
    } else {
      await locator.fill(field.value);
    }
    return true;
  } catch {
    return false;
  }
}

async function tryClickFromCache(page: Page, comercio: string, key: string): Promise<boolean> {
  const selector = await getCachedSelector(comercio, key);
  if (!selector) return false;
  try {
    const locator = page.locator(selector).first();
    if (!(await locator.isVisible({ timeout: 3_000 }))) return false;
    await locator.click();
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

async function fillFieldStage(
  page: Page,
  ctx: StageContext,
  field: FieldSpec
): Promise<{ usedVision: boolean }> {
  let capturedSelector: string | null = null;

  const result = await runStage(
    page,
    ctx,
    `campo-${field.key}`,
    `${field.goal} Escribe/selecciona exactamente: "${field.value}". ` +
      `El objetivo se cumple en cuanto el campo muestra ese valor.`,
    async () => tryFillFromCache(page, ctx.comercio, field),
    async () => {
      // Best-effort: confirmamos por texto visible en pantalla. No hay un
      // selector fijo que consultar aquí porque, por definición, este
      // comercio no tiene selectores conocidos de antemano.
      const bodyText = (await page.textContent("body").catch(() => "")) ?? "";
      return bodyText.includes(field.value);
    },
    async (action) => {
      if (action.action === "type" || action.action === "select") {
        capturedSelector = await getSelectorAtPoint(page, action.x, action.y).catch(() => null);
      }
    }
  );

  if (result.usedVision && capturedSelector) {
    await saveCachedSelector(ctx.comercio, field.key, capturedSelector);
  }

  return result;
}

export function createGenericVisionDriver(config: GenericMerchantConfig) {
  const { comercio, portalUrlEnvVar } = config;

  return {
    async ejecutarFacturacion(ticket: Ticket, usuario: Usuario): Promise<FacturacionResult> {
      const portalUrl = process.env[portalUrlEnvVar];
      if (!portalUrl) {
        throw new Error(
          `Driver de ${comercio} no configurado: falta la variable de entorno ${portalUrlEnvVar} ` +
            `con la URL del portal de autofacturación. Este comercio no tiene selectores ni URL ` +
            `verificados todavía — configúrala cuando la confirmes para activar el driver.`
        );
      }
      if (!ticket.numero_ticket) throw new Error("Número de ticket faltante");
      if (!ticket.total) throw new Error("Total del ticket faltante");
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY no configurada — requerida por este driver (100% basado en Gemini Vision)");
      }

      const startedAt = Date.now();
      await logAutomationEvent({ ticketId: ticket.id, comercio, status: "started" });

      const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `facturabot-${comercio.toLowerCase()}-${ticket.id}-`));
      const browser = await createBrowser();
      const ctx: StageContext = { comercio, ticketId: ticket.id, workDir };
      let usedVisionAnyStage = false;

      try {
        const page = await createStealthPage(browser);

        log(comercio, ticket.id, "navigate", `Navegando a ${portalUrl}`);
        await page.goto(portalUrl, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1500);

        try {
          const cookieBtn = page.locator(
            'button:has-text("Aceptar"), button:has-text("Accept"), #onetrust-accept-btn-handler'
          );
          if (await cookieBtn.isVisible({ timeout: 3_000 })) {
            await cookieBtn.click();
            await page.waitForTimeout(500);
          }
        } catch {
          // Banner opcional
        }

        const fields: FieldSpec[] = [
          {
            key: "folio",
            goal: "Localiza el campo de número de ticket, folio o referencia de la compra.",
            value: ticket.numero_ticket!,
            inputType: "text",
          },
          {
            key: "total",
            goal: "Localiza el campo de total o importe de la compra.",
            value: ticket.total!.toFixed(2),
            inputType: "text",
          },
          {
            key: "rfc",
            goal: "Localiza el campo de RFC del cliente que solicita la factura.",
            value: usuario.rfc,
            inputType: "text",
          },
          {
            key: "nombre",
            goal: "Localiza el campo de nombre o razón social del cliente.",
            value: usuario.nombre,
            inputType: "text",
          },
          {
            key: "correo",
            goal: "Localiza el campo de correo electrónico para enviar la factura.",
            value: usuario.correo,
            inputType: "text",
          },
          {
            key: "regimen",
            goal: "Localiza el selector de régimen fiscal SAT.",
            value: usuario.regimen_fiscal,
            inputType: "select",
          },
          {
            key: "uso_cfdi",
            goal: "Localiza el selector de uso de CFDI.",
            value: usuario.uso_cfdi,
            inputType: "select",
          },
        ];

        for (const field of fields) {
          const fieldResult = await fillFieldStage(page, ctx, field);
          usedVisionAnyStage ||= fieldResult.usedVision;
        }

        const submitStage = await runStage(
          page,
          ctx,
          "submit",
          'Da clic en el botón para generar, solicitar o confirmar la factura ' +
            '(usualmente dice "Facturar", "Generar Factura" o "Solicitar Factura"). ' +
            "El objetivo se cumple cuando aparece una pantalla de confirmación, descarga, o éxito.",
          async () => tryClickFromCache(page, comercio, "submit_btn"),
          async () => {
            const pageText = ((await page.textContent("body").catch(() => "")) ?? "").toLowerCase();
            if (pageText.includes("ya fue facturado") || pageText.includes("no fue posible")) {
              throw new Error(`${comercio} reportó un error de facturación irreversible para este ticket`);
            }
            const hasDownloadLink = await page
              .locator('a[href*=".xml"], a[href*=".pdf"], a:has-text("Descargar")')
              .first()
              .isVisible({ timeout: 1_000 })
              .catch(() => false);
            return hasDownloadLink || pageText.includes("factura generada") || pageText.includes("éxito");
          },
          async (action) => {
            if (action.action === "click") {
              const selector = await getSelectorAtPoint(page, action.x, action.y).catch(() => null);
              if (selector) await saveCachedSelector(comercio, "submit_btn", selector);
            }
          }
        );
        usedVisionAnyStage ||= submitStage.usedVision;

        await saveDebugArtifact(page, workDir, "post-facturacion-success");

        // -----------------------------------------------------------------
        // Descarga de XML/PDF — mismo patrón que OXXO: link directo primero,
        // listener de download adjuntado ANTES del loop de visión por si el
        // clic dispara una descarga real del navegador.
        // -----------------------------------------------------------------
        let xmlPath = path.join(workDir, "factura.xml");
        let pdfPath = path.join(workDir, "factura.pdf");

        const downloadViaLink = async (selectors: string[], destPath: string): Promise<boolean> => {
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

        let xmlDownloaded = await downloadViaLink(
          ['a:has-text("XML")', 'a[href*=".xml"]', 'a[download*="xml" i]'],
          xmlPath
        );

        if (!xmlDownloaded) {
          let visionCapturedXml = false;
          const onDownload = async (download: import("playwright").Download): Promise<void> => {
            try {
              await download.saveAs(xmlPath);
              visionCapturedXml = true;
            } catch {
              // checked via isComplete below
            }
          };
          page.on("download", onDownload);

          const xmlStage = await runStage(
            page,
            ctx,
            "descarga-xml-vision",
            "Encuentra y da clic en el enlace o botón para descargar el archivo XML de la factura.",
            async () => false,
            async () => visionCapturedXml
          ).catch(() => ({ usedVision: true }));
          usedVisionAnyStage ||= xmlStage.usedVision;

          page.off("download", onDownload);
          xmlDownloaded = visionCapturedXml && (await fs.stat(xmlPath).then(() => true).catch(() => false));
        }

        if (!xmlDownloaded) {
          await saveDebugArtifact(page, workDir, "xml-download-failed");
          throw new Error(`No se pudo descargar el XML de la factura desde el portal de ${comercio}`);
        }

        let pdfDownloaded = await downloadViaLink(
          ['a:has-text("PDF")', 'a[href*=".pdf"]', 'a[download*="pdf" i]'],
          pdfPath
        );

        if (!pdfDownloaded) {
          await page.pdf({
            path: pdfPath,
            format: "A4",
            printBackground: true,
            margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
          });
        }

        const [xmlStat, pdfStat] = await Promise.all([fs.stat(xmlPath), fs.stat(pdfPath)]);
        if (xmlStat.size < 100) throw new Error("El XML descargado está vacío o es inválido");
        if (pdfStat.size < 1000) throw new Error("El PDF descargado está vacío o es inválido");

        const xmlContent = await fs.readFile(xmlPath, "utf-8");
        if (!xmlContent.includes("Comprobante")) {
          throw new Error("El XML descargado no corresponde a un CFDI válido del SAT");
        }

        log(comercio, ticket.id, "completado", `XML: ${xmlPath}, PDF: ${pdfPath}`);
        await logAutomationEvent({
          ticketId: ticket.id,
          comercio,
          status: "success",
          durationMs: Date.now() - startedAt,
          usedVisionFallback: usedVisionAnyStage,
        });
        return { xmlPath, pdfPath };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        log(comercio, ticket.id, "error-fatal", msg);
        await alertAdminOnFailure(comercio, ticket, msg);
        await logAutomationEvent({
          ticketId: ticket.id,
          comercio,
          status: "error",
          durationMs: Date.now() - startedAt,
          errorMessage: msg,
          usedVisionFallback: usedVisionAnyStage,
        });
        throw new Error(`${comercio} scraper: ${msg}`);
      } finally {
        await browser.close();
      }
    },
  };
}
