# PROJECT_STATUS.md — FacturaBot MX

Auditoría hecha sobre el código real en el repo (rama `claude/sharp-lamport-sjxwsn`), no sobre lo que se planeó. Fecha: 2026-06-30.

## Qué funciona (verificado: compila, lógica revisada)

- **Servidor Express** (`server/src/app.ts`, 1046 líneas): boot con validación de env vars, cola BullMQ (`ticket-processing`, `billing-execution`), webhook de WhatsApp (`GET`/`POST /webhook/whatsapp`), endpoint `/health`, endpoint `/api/automation-rate`.
- **OCR de tickets**: `extractTicketData()` en `app.ts` usa `getGeminiModel().generateContent()` con `gemini-1.5-flash` + Structured Outputs (Zod) para extraer comercio/folio/total/fecha de la imagen del ticket. Lógica correcta, nunca probada contra una imagen real porque requiere `GEMINI_API_KEY` real (el `.env` actual tiene placeholders).
- **Merchant Intelligence Engine** (`server/src/drivers/registry.ts`): registro que resuelve qué driver usar según `ticket.comercio` (match por substring normalizado). Código correcto, sin dependencias rotas.
- **Vision Engine compartido** (`server/src/drivers/visionEngine.ts`, 318 líneas): loop de automatización con Playwright + fallback a Gemini Vision cuando un selector CSS falla. Nunca ejecutado contra un sitio real en este entorno (sandbox sin acceso a internet general).
- **Selector cache / self-healing** (`server/src/drivers/selectorCache.ts`): guarda en Supabase el selector que Vision usó con éxito, para no tener que llamar a Vision otra vez. Requiere la tabla `driver_selectors` (SQL en `.env.example`), que **no existe todavía en ningún Supabase real** porque nunca se ha conectado a un proyecto Supabase real.
- **Observabilidad** (`server/src/drivers/observability.ts`): inserta eventos en `automation_events` (también sin crear todavía) y expone `GET /api/automation-rate`.
- **Driver OXXO** (`server/src/scrapers/oxxo.scraper.ts`, 385 líneas): selectores CSS escritos *por inferencia razonable* sobre cómo suelen ser estos formularios (`input[name*="folio" i]`, etc.), **no copiados del HTML real de factura.oxxo.com** porque este entorno no puede alcanzar ese dominio. Apunta a `https://factura.oxxo.com/`.
- **Driver Costco** (`server/src/scrapers/costco.scraper.ts`, 584 líneas): mismo caso — selectores razonados, nunca verificados contra el portal real.
- **Drivers genéricos Walmart/Starbucks/Zara** (`server/src/drivers/genericVisionDriver.ts`): 100% dependientes de Gemini Vision, se niegan a arrancar si no defines `MERCHANT_PORTAL_WALMART/STARBUCKS/ZARA` en `.env` (a propósito, para no inventar URLs).
- **Frontend** (`src/App.tsx` + componentes en `src/components/`): UI tipo Fotofacturas (Paywall, Facturas, Subir Ticket, Cuenta), construida y verificada visualmente con Playwright screenshots. No está conectada a ningún backend — es una maqueta funcional en React, sin fetch real al servidor.
- **`npx tsc --noEmit`** en `server/`: pasa sin errores (verificado ahora mismo).

## Qué NO funciona / nunca se ha probado

- **Cero invoices reales generadas.** Nunca se ejecutó el flujo completo contra Supabase, WhatsApp, OXXO o cualquier portal real.
- **`server/.env` tiene solo placeholders** (`TU_PROYECTO`, `TU_API_KEY`, `EAA_TU_ACCESS_TOKEN`, etc.) — el servidor no arranca tal como está porque `app.ts` valida que las env vars existan, pero ninguna apunta a un servicio real.
- **No existe ningún proyecto Supabase real conectado.** Las tablas `usuarios`, `tickets`, `automation_events`, `driver_selectors` están documentadas como SQL en `.env.example` pero no se han ejecutado en ningún Supabase real.
- **No hay número de WhatsApp Business real configurado** (Meta Cloud API). El webhook está implementado pero nunca recibió un mensaje real.
- **Los selectores CSS de OXXO/Costco son no verificados.** Si el formulario real usa nombres distintos a los asumidos, el "fast path" fallará y todo dependerá del fallback de Gemini Vision (que sí tiene mejor probabilidad de funcionar, pero tampoco se ha probado un solo intento real).
- **No hay tests automatizados** (unitarios, integración, e2e) en ninguna parte del repo.
- **No se ha desplegado a Railway ni a ningún otro servicio.** Existen `Dockerfile`, `docker-compose.yml`, `railway.json`, `ecosystem.config.cjs` en `server/`, pero ninguno se ha ejecutado fuera de este sandbox.
- **El frontend no llama al backend.** Es una UI estática con datos de ejemplo (mock), sin `fetch`/`axios` hacia `/api/*`.

## Pendiente

1. Crear un proyecto Supabase real, ejecutar el SQL completo de `.env.example` (las 4 tablas).
2. Conseguir credenciales reales: Gemini API key, Meta WhatsApp Cloud API (token + phone_number_id + verify token), SMTP.
3. Levantar Redis real (local o managed) para BullMQ.
4. Llenar `server/.env` con esos valores reales.
5. Correr el servidor (`npm run dev` en `server/`) y mandar **una imagen de ticket real de OXXO** por WhatsApp, para validar: OCR → detección de comercio → llamada al driver OXXO → si los selectores fallan, observar si el fallback de Vision logra completar el formulario → descarga de XML/PDF → envío por correo/WhatsApp.
6. Ajustar los selectores de `oxxo.scraper.ts` con base en lo que se observe en el paso 5 (es la primera vez que se verán contra el sitio real).
7. Conectar el frontend (`src/App.tsx`) al backend real en vez de usar datos mock.
8. Desplegar a Railway (configuración ya existe en `server/`, falta ejecutarla).
9. Repetir el ciclo de prueba para Costco y, si se decide continuar, para Walmart/Starbucks/Zara (requieren además configurar `MERCHANT_PORTAL_*` con URLs reales del portal de autofacturación de cada uno).

## Próximos pasos (orden recomendado)

1. Supabase real + SQL.
2. Credenciales reales en `.env`.
3. Una factura real de OXXO de principio a fin (esto es la prueba de fuego — todo lo demás es secundario hasta que esto funcione una vez).
4. Deploy a Railway.
5. Conectar frontend.

## Comandos para ejecutar

```bash
# Backend
cd server
cp .env.example .env        # y llenar con credenciales reales
npm install
npm run typecheck            # tsc --noEmit
npm run dev                  # tsx watch src/app.ts (puerto APP_PORT)

# Producción
npm run build                # tsc -> dist/
npm start                    # node dist/app.js
# o con pm2:
npm run pm2:start

# Frontend (raíz del repo)
npm install
npm run dev                  # vite, puerto 5173 por defecto
```

## Variables .env necesarias (server/.env)

Obligatorias para que el servidor arranque (`app.ts` hace `process.exit(1)` si falta alguna):

```
APP_PORT, SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY, REDIS_URL,
META_VERIFY_TOKEN, META_ACCESS_TOKEN, META_PHONE_NUMBER_ID,
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
```

Opcionales:

```
ADMIN_WHATSAPP_NUMBER         # alertas cuando un driver falla
MERCHANT_PORTAL_WALMART
MERCHANT_PORTAL_STARBUCKS
MERCHANT_PORTAL_ZARA          # solo si vas a activar esos comercios
CHROMIUM_PATH                 # si usas un Chromium custom
```

Ver `.env.example` en la raíz para el detalle y el SQL completo de las 4 tablas de Supabase.
