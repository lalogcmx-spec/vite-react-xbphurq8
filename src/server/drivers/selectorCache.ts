import { Page } from "playwright";
import { supabase } from "../lib/supabaseClient";

// Self-healing real (no mágico): cuando GPT Vision encuentra y usa un
// elemento exitosamente, guardamos el selector CSS resultante en
// Supabase. La próxima corrida intenta ese selector cacheado ANTES de
// recurrir a Vision de nuevo — así el driver "aprende" sin que nadie
// reescriba código. Si el selector cacheado deja de funcionar (el
// portal cambió), el caller vuelve a caer en Vision y el caché se
// sobreescribe con el nuevo selector. Best-effort: si Supabase falla,
// el driver simplemente no usa caché esa corrida, nunca debe tumbar
// la facturación real.

export async function getCachedSelector(
  comercio: string,
  campo: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("driver_selectors")
      .select("selector")
      .eq("comercio", comercio)
      .eq("campo", campo)
      .order("last_success_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return (data as { selector: string }).selector;
  } catch {
    return null;
  }
}

export async function saveCachedSelector(
  comercio: string,
  campo: string,
  selector: string
): Promise<void> {
  try {
    await supabase.from("driver_selectors").upsert(
      {
        comercio,
        campo,
        selector,
        last_success_at: new Date().toISOString(),
      },
      { onConflict: "comercio,campo" }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SelectorCache] No se pudo guardar selector (no fatal): ${msg}`);
  }
}

// Construye un selector CSS razonablemente estable a partir del elemento
// que está en (x, y) en el viewport actual. Prioriza id > name > atributos
// > tag+nth-of-type como último recurso. Corre dentro del contexto del
// navegador (string-based, igual que el resto del motor de visión) porque
// document/Element no existen en el TS lib de Node.
export async function getSelectorAtPoint(
  page: Page,
  x: number,
  y: number
): Promise<string | null> {
  const selector = await page.evaluate(`
    (() => {
      const el = document.elementFromPoint(${x}, ${y});
      if (!el) return null;
      if (el.id) return '#' + CSS.escape(el.id);
      const name = el.getAttribute('name');
      if (name) return el.tagName.toLowerCase() + '[name="' + name + '"]';
      const placeholder = el.getAttribute('placeholder');
      if (placeholder) return el.tagName.toLowerCase() + '[placeholder="' + placeholder + '"]';
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
        const idx = siblings.indexOf(el) + 1;
        return el.tagName.toLowerCase() + ':nth-of-type(' + idx + ')';
      }
      return el.tagName.toLowerCase();
    })()
  `);
  return (selector as string | null) ?? null;
}
