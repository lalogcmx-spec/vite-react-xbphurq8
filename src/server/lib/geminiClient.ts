import { GoogleGenerativeAI } from "@google/generative-ai";

export const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// gemini-1.5-flash: capa gratuita (15 req/min, 1M tokens/día al momento de
// escribir esto), suficiente para OCR de tickets y para el fallback de
// visión de los drivers. Si la cuota gratuita no alcanza en producción,
// cambiar a "gemini-1.5-pro" aquí sin tocar el resto del código.
export const GEMINI_MODEL = "gemini-1.5-flash";

export function getGeminiModel() {
  return gemini.getGenerativeModel({ model: GEMINI_MODEL });
}

/**
 * Extrae el primer bloque JSON de un texto de respuesta de Gemini.
 * Gemini con responseMimeType "application/json" normalmente devuelve JSON
 * puro, pero a veces lo envuelve en ```json ... ``` — esto cubre ambos casos.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1] : trimmed;
  return JSON.parse(jsonText);
}
