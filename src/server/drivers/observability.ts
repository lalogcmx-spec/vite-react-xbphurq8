import { supabase } from "../lib/supabaseClient";

// Requiere la tabla `automation_events` en Supabase (ver .env.example).
// Logging best-effort: si la tabla no existe todavía o Supabase falla,
// NUNCA debe tumbar la facturación real — solo se registra en consola.

export interface AutomationEventInput {
  ticketId: string;
  comercio: string;
  status: "started" | "success" | "error";
  durationMs?: number;
  errorMessage?: string;
  usedVisionFallback?: boolean;
  usedSelectorCache?: boolean;
}

export async function logAutomationEvent(event: AutomationEventInput): Promise<void> {
  try {
    const { error } = await supabase.from("automation_events").insert({
      ticket_id: event.ticketId,
      comercio: event.comercio,
      status: event.status,
      duration_ms: event.durationMs ?? null,
      error_message: event.errorMessage ?? null,
      used_vision_fallback: event.usedVisionFallback ?? false,
      used_selector_cache: event.usedSelectorCache ?? false,
    });
    if (error) {
      console.error(`[Observability] No se pudo registrar evento: ${error.message}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Observability] Error al registrar evento (no fatal): ${msg}`);
  }
}

export interface AutomationRate {
  comercio: string;
  total: number;
  exitosos: number;
  fallidos: number;
  automationRate: number;
}

// KPI principal: % de tickets facturados sin intervención humana, por comercio.
export async function getAutomationRate(): Promise<AutomationRate[]> {
  const { data, error } = await supabase
    .from("automation_events")
    .select("comercio, status")
    .in("status", ["success", "error"]);

  if (error) throw new Error(`Supabase getAutomationRate: ${error.message}`);

  const byComercio = new Map<string, { exitosos: number; fallidos: number }>();
  for (const row of (data ?? []) as Array<{ comercio: string; status: string }>) {
    const entry = byComercio.get(row.comercio) ?? { exitosos: 0, fallidos: 0 };
    if (row.status === "success") entry.exitosos += 1;
    else entry.fallidos += 1;
    byComercio.set(row.comercio, entry);
  }

  return Array.from(byComercio.entries()).map(([comercio, { exitosos, fallidos }]) => ({
    comercio,
    total: exitosos + fallidos,
    exitosos,
    fallidos,
    automationRate: exitosos + fallidos > 0 ? exitosos / (exitosos + fallidos) : 0,
  }));
}
