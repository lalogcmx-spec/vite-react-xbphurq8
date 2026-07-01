import { chromium, Browser, Page } from "playwright";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";
import { getGeminiModel, extractJson } from "../lib/geminiClient";

// ---------------------------------------------------------------------------
// BROWSER AGENT — fábrica de navegador headless con perfil "stealth",
// compartida por todos los drivers (OXXO, genéricos, futuros).
// ---------------------------------------------------------------------------
const TIMEOUT_MS = 45_000;
const NAVIGATION_TIMEOUT_MS = 90_000;

export async function createBrowser(): Promise<Browser> {
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

export async function createStealthPage(browser: Browser): Promise<Page> {
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
// LOGGING + OBSERVABILIDAD LOCAL — corre sin supervisión, todo debe quedar
// trazable en disco (screenshots + HTML) además de en la tabla automation_events.
// ---------------------------------------------------------------------------
export function log(comercio: string, ticketId: string, stage: string, msg: string): void {
  console.log(`[${comercio}][${ticketId}][${stage}] ${msg}`);
}

export async function saveDebugArtifact(
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
// AI VISUAL FALLBACK — el mismo motor de decisión por Gemini Vision que usa
// OXXO, generalizado para cualquier portal/comercio.
// ---------------------------------------------------------------------------
const MAX_VISION_STEPS_PER_STAGE = 8;
const MAX_STAGE_RETRIES = 3;

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

export type VisionAction = z.infer<typeof VisionActionSchema>;

export async function askVisionForNextAction(
  page: Page,
  comercioLabel: string,
  goalDescription: string,
  history: string[]
): Promise<VisionAction> {
  const screenshotBuffer = await page.screenshot({ fullPage: false });
  const base64 = screenshotBuffer.toString("base64");

  const model = getGeminiModel();
  const systemPrompt =
    `Eres un agente de automatización web que opera un navegador headless sin supervisión humana, ` +
    `de madrugada, sobre el portal de facturación de ${comercioLabel} México. ` +
    "Recibes un screenshot del viewport actual (1366x900) y debes decidir la SIGUIENTE acción única " +
    "para avanzar hacia el objetivo. Sé conservador: si no estás seguro de qué hacer, usa 'wait'. " +
    "Si detectas un captcha, un bloqueo de seguridad, o un error que un script no puede resolver, " +
    "usa 'blocked' y explica por qué. Las coordenadas x,y deben ser el centro del elemento, " +
    "en píxeles relativos al viewport visible (no a la página completa).\n\n" +
    "Responde ÚNICAMENTE con un objeto JSON con esta forma exacta (sin texto adicional, sin markdown):\n" +
    `{"reasoning": string, "action": "click"|"type"|"select"|"wait"|"scroll"|"done"|"blocked", ` +
    `"x": number, "y": number, "textToType": string, "selectValue": string, "blockedReason": string}`;

  const userPrompt =
    `OBJETIVO ACTUAL: ${goalDescription}\n\n` +
    `HISTORIAL DE ACCIONES PREVIAS (más reciente al final):\n` +
    (history.length > 0 ? history.join("\n") : "(ninguna aún)") +
    `\n\nAnaliza el screenshot adjunto y decide la siguiente acción.`;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: `${systemPrompt}\n\n${userPrompt}` },
          { inlineData: { mimeType: "image/png", data: base64 } },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 600 },
  });

  const text = result.response.text();
  let rawJson: unknown;
  try {
    rawJson = extractJson(text);
  } catch {
    throw new Error(`Gemini Vision no devolvió JSON válido: ${text.slice(0, 300)}`);
  }

  const parsed = VisionActionSchema.safeParse(rawJson);
  if (!parsed.success) {
    throw new Error(`Gemini Vision devolvió un objeto que no cumple el schema esperado: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function executeVisionAction(page: Page, action: VisionAction): Promise<void> {
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
      // Corre dentro del contexto del navegador — document/HTMLSelectElement
      // existen ahí, no en el lib de TS de Node, de ahí el string en vez de función.
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
// STAGE RUNNER — intenta selectores rápidos (CSS hardcodeado o caché de
// self-healing) primero, cae a la visión solo si hace falta, reintenta la
// etapa completa hasta MAX_STAGE_RETRIES veces.
// ---------------------------------------------------------------------------
export interface StageContext {
  comercio: string;
  ticketId: string;
  workDir: string;
}

export async function runStage(
  page: Page,
  ctx: StageContext,
  stageName: string,
  goalDescription: string,
  fastPath: () => Promise<boolean>,
  isComplete: () => Promise<boolean>,
  onVisionAction?: (action: VisionAction) => Promise<void>
): Promise<{ usedVision: boolean }> {
  let usedVision = false;

  for (let attempt = 1; attempt <= MAX_STAGE_RETRIES; attempt++) {
    log(ctx.comercio, ctx.ticketId, stageName, `Intento ${attempt}/${MAX_STAGE_RETRIES}`);

    try {
      const fastPathWorked = await fastPath();
      if (fastPathWorked && (await isComplete())) {
        log(ctx.comercio, ctx.ticketId, stageName, "Completado vía selectores rápidos/caché");
        return { usedVision };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(ctx.comercio, ctx.ticketId, stageName, `Fast path falló: ${msg}. Cayendo a Gemini Vision.`);
    }

    if (await isComplete()) {
      log(ctx.comercio, ctx.ticketId, stageName, "Ya estaba completado antes de usar visión");
      return { usedVision };
    }

    log(ctx.comercio, ctx.ticketId, stageName, "Activando modo Gemini Vision (auto-recuperación)");
    usedVision = true;
    const history: string[] = [];

    for (let step = 1; step <= MAX_VISION_STEPS_PER_STAGE; step++) {
      const action = await askVisionForNextAction(page, ctx.comercio, goalDescription, history);
      log(
        ctx.comercio,
        ctx.ticketId,
        stageName,
        `Vision step ${step}: ${action.action} @ (${action.x},${action.y}) — ${action.reasoning}`
      );

      if (action.action === "blocked") {
        await saveDebugArtifact(page, ctx.workDir, `${stageName}-blocked`);
        throw new Error(
          `${ctx.comercio} bloqueó la automatización en etapa "${stageName}": ${action.blockedReason}`
        );
      }

      if (action.action === "done") {
        if (await isComplete()) {
          log(ctx.comercio, ctx.ticketId, stageName, "Completado vía Gemini Vision");
          return { usedVision };
        }
        history.push(`Paso ${step}: GPT dijo 'done' pero la validación de etapa aún no pasa.`);
        continue;
      }

      await executeVisionAction(page, action);
      if (onVisionAction) await onVisionAction(action);
      history.push(`Paso ${step}: ${action.action} (${action.reasoning})`);

      if (await isComplete()) {
        log(ctx.comercio, ctx.ticketId, stageName, `Completado vía Gemini Vision tras ${step} pasos`);
        return { usedVision };
      }
    }

    await saveDebugArtifact(page, ctx.workDir, `${stageName}-attempt${attempt}-exhausted`);
    log(
      ctx.comercio,
      ctx.ticketId,
      stageName,
      `Se agotaron los ${MAX_VISION_STEPS_PER_STAGE} pasos de visión sin completar la etapa`
    );
  }

  throw new Error(
    `No se pudo completar la etapa "${stageName}" tras ${MAX_STAGE_RETRIES} intentos (selectores + visión)`
  );
}
