# README_ARCHITECTURE.md

Mapa del código real, no del diseño aspiracional. Cada componente listado existe en el repo en este momento.

## Diagrama de flujo (lo que el código implementa)

```
WhatsApp (usuario manda foto de ticket)
   │
   ▼
POST /webhook/whatsapp  (server/src/app.ts)
   │  descarga la imagen de Meta, sube a Supabase Storage (bucket "tickets")
   │  crea fila en tabla "tickets" (status: recibido)
   │  encola job en BullMQ queue "ticket-processing"
   ▼
ticketProcessingWorker  (server/src/app.ts, Worker #1)
   │  descarga imagen, la pasa a extractTicketData()
   │  → openai.beta.chat.completions.parse() con gpt-4o-mini + Zod schema
   │  guarda comercio/folio/total/fecha/hora en la fila de "tickets"
   │  status → esperando_confirmacion
   │  manda mensaje de confirmación al usuario por WhatsApp
   ▼
(usuario confirma por WhatsApp)
   │  status → en_cola_facturacion
   │  encola job en BullMQ queue "billing-execution"
   ▼
billingExecutionWorker  (server/src/app.ts, Worker #2)
   │  resolveDriver(ticket.comercio)  → server/src/drivers/registry.ts
   │  driverEntry.load()              → import dinámico del driver correcto
   │  scraper.ejecutarFacturacion(ticket, usuario)
   │       │
   │       ├─ OXXO / Costco → scraper dedicado con selectores CSS +
   │       │   fallback a Vision (server/src/drivers/visionEngine.ts)
   │       │
   │       └─ Walmart/Starbucks/Zara → driver 100% Vision
   │           (server/src/drivers/genericVisionDriver.ts)
   │
   │  cada "stage" intenta: 1) selector cacheado (driver_selectors,
   │  self-healing) → 2) selector CSS hardcodeado → 3) GPT-4o Vision
   │  encuentra el elemento por screenshot y coordenadas (x,y)
   │
   │  descarga XML + PDF de la factura, valida tamaño/contenido
   │  sube a Supabase Storage (bucket "facturas")
   │  status → facturado
   │  envía factura por correo (nodemailer) y por WhatsApp
   ▼
Usuario recibe XML + PDF
```

Si algo falla en cualquier paso: `status → error`, `error_message` guardado en la fila del ticket, `alertAdminOnFailure()` notifica al `ADMIN_WHATSAPP_NUMBER` (si está configurado), y se registra un evento `status: "error"` en `automation_events`.

## Componentes y archivos

### Backend (`server/src/`)

| Archivo | Responsabilidad |
|---|---|
| `app.ts` | Servidor Express, validación de env, clientes (Supabase/OpenAI/Redis/SMTP), colas BullMQ y sus dos workers, webhook de WhatsApp, OCR (`extractTicketData`), endpoints `/health` y `/api/automation-rate` |
| `drivers/registry.ts` | Resuelve qué driver usar según `ticket.comercio` (Merchant Intelligence Engine) |
| `drivers/visionEngine.ts` | Motor compartido: lanza Chromium con Playwright (`createBrowser`, `createStealthPage`), loop de automatización con fallback a GPT-4o Vision (`runStage`, `askVisionForNextAction`, `executeVisionAction`) |
| `drivers/genericVisionDriver.ts` | Driver 100% Vision para comercios sin selectores conocidos (Walmart/Starbucks/Zara), requiere `MERCHANT_PORTAL_*` en env |
| `drivers/selectorCache.ts` | Self-healing: guarda/lee selectores CSS exitosos en tabla `driver_selectors` |
| `drivers/observability.ts` | Inserta/lee eventos de la tabla `automation_events`, calcula `automation_rate` por comercio |
| `drivers/adminAlert.ts` | Manda WhatsApp al admin cuando un driver falla completamente |
| `lib/supabaseClient.ts` | Cliente Supabase compartido (usado por los módulos nuevos en `drivers/`; `app.ts` todavía crea su propio cliente inline — ambos apuntan al mismo proyecto, es redundante pero no incorrecto) |
| `scrapers/oxxo.scraper.ts` | Driver dedicado de OXXO (selectores CSS + fallback Vision) |
| `scrapers/costco.scraper.ts` | Driver dedicado de Costco (selectores CSS + fallback Vision) |

### Frontend (`src/`)

| Archivo | Responsabilidad |
|---|---|
| `App.tsx` | Shell de la app, navegación entre pantallas |
| `components/Paywall.tsx` | Pantalla de suscripción ($99/$299) |
| `components/FacturasScreen.tsx` | Lista de facturas (home) |
| `components/SubirTicketScreen.tsx` | Flujo de 3 pasos para subir ticket |
| `components/CuentaScreen.tsx` | Pantalla de cuenta del usuario |

**El frontend no está conectado al backend** — usa datos mock, no hace `fetch` a `/api/*` ni al webhook.

### Infra (`server/`)

| Archivo | Responsabilidad |
|---|---|
| `Dockerfile` | Imagen de producción basada en `mcr.microsoft.com/playwright` |
| `docker-compose.yml` | Redis + app para correr local con Docker |
| `railway.json` | Config de build/deploy para Railway |
| `ecosystem.config.cjs` | Config de PM2 para correr sin contenedores |
| `bootstrap.sh` | Script que valida que `.env` tenga valores reales antes de arrancar |

## Por qué dos árboles de fuente (`server/src/` y `src/server/`)

Limitación heredada de cómo se fue armando el repo en este sandbox: `server/src/` es donde realmente corre `tsc`/`tsx` (tiene su propio `package.json`, `tsconfig.json`, `node_modules`), y `src/server/` es una copia idéntica que vive dentro del árbol principal del repo para que `git` la trackee junto con el frontend en un solo commit. **Ambas copias deben mantenerse sincronizadas manualmente** (`cp` archivo por archivo) cada vez que se edita algo en `server/src/`. Esto es deuda técnica conocida, no un bug — documentado aquí para que el siguiente ingeniero no se sorprenda ni asuma que están desincronizadas por accidente.

## Decisiones de diseño explícitas

- **No se adivinan URLs de portales.** `genericVisionDriver.ts` lanza error explícito si `MERCHANT_PORTAL_*` no está definida, en vez de inventar una URL.
- **Self-healing = selector cache, no reescritura de código.** Cuando se dice "self-healing" en este proyecto, significa: GPT Vision encuentra un elemento → se captura su selector CSS en runtime → se guarda en Supabase → la próxima vez se intenta ese selector primero. Si dejó de funcionar, se vuelve a usar Vision y se sobreescribe. El código fuente de los drivers nunca se modifica automáticamente.
- **BullMQ usa `{ url: REDIS_URL }`**, no una instancia `ioredis` separada — esto fue un fix deliberado de una sesión anterior (ioredis duplicado causaba conexiones huérfanas).
