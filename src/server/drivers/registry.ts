import { createGenericVisionDriver } from "./genericVisionDriver";

export interface DriverModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ejecutarFacturacion: (ticket: any, usuario: any) => Promise<{ xmlPath: string; pdfPath: string }>;
}

interface RegistryEntry {
  comercio: string;
  // Claves usadas para hacer match contra ticket.comercio (en minúsculas, sin espacios)
  matchKeys: string[];
  verified: boolean; // ¿selectores/flujo probados contra el portal real?
  load: () => Promise<DriverModule>;
}

// ---------------------------------------------------------------------------
// MERCHANT INTELLIGENCE ENGINE — punto único de verdad sobre qué driver usar
// para cada comercio. Reemplaza el if/else que vivía en el worker de
// billing-execution. Top 5 del MVP: OXXO, Costco, Walmart, Starbucks, Zara.
//
// `verified: false` no es decorativo — son los comercios cuyo portal NUNCA
// se ha visto en vivo desde este entorno (sin acceso a internet general).
// Walmart/Starbucks/Zara/Soriana corren 100% sobre Gemini Vision porque no
// existen selectores conocidos, y requieren configurar la URL real del
// portal vía variable de entorno antes de poder facturar un solo ticket.
// ---------------------------------------------------------------------------
const REGISTRY: RegistryEntry[] = [
  {
    comercio: "Costco",
    matchKeys: ["costco"],
    verified: false,
    load: () => import("../scrapers/costco.scraper"),
  },
  {
    comercio: "OXXO",
    matchKeys: ["oxxo"],
    verified: false,
    load: () => import("../scrapers/oxxo.scraper"),
  },
  {
    comercio: "Walmart",
    matchKeys: ["walmart", "walmartmexico"],
    verified: false,
    load: async () => createGenericVisionDriver({
      comercio: "Walmart",
      portalUrlEnvVar: "MERCHANT_PORTAL_WALMART",
    }),
  },
  {
    comercio: "Starbucks",
    matchKeys: ["starbucks"],
    verified: false,
    load: async () => createGenericVisionDriver({
      comercio: "Starbucks",
      portalUrlEnvVar: "MERCHANT_PORTAL_STARBUCKS",
    }),
  },
  {
    comercio: "Zara",
    matchKeys: ["zara"],
    verified: false,
    load: async () => createGenericVisionDriver({
      comercio: "Zara",
      portalUrlEnvVar: "MERCHANT_PORTAL_ZARA",
    }),
  },
];

function normalize(comercio: string): string {
  return comercio.toLowerCase().replace(/\s+/g, "");
}

export function resolveDriver(comercioRaw: string): RegistryEntry | null {
  const key = normalize(comercioRaw);
  return REGISTRY.find((entry) => entry.matchKeys.some((mk) => key.includes(mk))) ?? null;
}

export function listRegisteredMerchants(): Array<{ comercio: string; verified: boolean }> {
  return REGISTRY.map(({ comercio, verified }) => ({ comercio, verified }));
}
