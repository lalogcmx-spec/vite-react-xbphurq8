# README_PRODUCTION.md

Estado honesto: este proyecto **nunca ha facturado un ticket real**. Todo el código compila y la lógica está completa, pero ningún driver, ninguna credencial y ningún servicio externo se ha probado fuera de este sandbox (sin acceso a internet general). Este documento es la checklist real para llegar a producción, sin relleno.

## 1. Servicios externos que necesitas (cuentas reales)

| Servicio | Para qué | Dónde |
|---|---|---|
| Supabase | Base de datos (usuarios, tickets, eventos, cache de selectores) | https://supabase.com |
| Gemini | OCR del ticket + Gemini Vision fallback en los drivers | https://aistudio.google.com/apikey |
| Redis | Cola BullMQ (procesamiento de tickets y facturación) | Upstash / Railway Redis / Redis Cloud |
| Meta WhatsApp Cloud API | Recibir tickets y enviar facturas por WhatsApp | https://developers.facebook.com |
| SMTP | Enviar factura por correo (Gmail App Password, SendGrid, Brevo, etc.) | el que prefieras |

## 2. Pasos exactos

1. **Supabase**: crea proyecto → SQL Editor → pega y ejecuta el SQL completo de `.env.example` (tablas `usuarios`, `tickets`, `automation_events`, `driver_selectors`) → crea buckets `tickets` (público) y `facturas` (privado/signed URLs) en Storage.
2. **Gemini**: genera API key con acceso a `gemini-1.5-flash`.
3. **Redis**: levanta una instancia, copia la `REDIS_URL`.
4. **Meta WhatsApp**: crea app en Meta for Developers, agrega producto WhatsApp, genera System User Access Token permanente, copia `phone_number_id`, define tu propio `META_VERIFY_TOKEN`.
5. **SMTP**: si usas Gmail, genera un App Password (no tu contraseña normal).
6. Copia `server/.env.example` → `server/.env` y llena los 13 valores obligatorios (ver `PROJECT_STATUS.md`).
7. `cd server && npm install && npm run typecheck` — debe pasar sin errores (ya está verificado contra el código actual).
8. `npm run dev` — el servidor debe arrancar y loggear el puerto. Si falta una env var, falla con `[BOOT] Missing required environment variable: X` — es intencional, no un bug.
9. Configura el webhook de WhatsApp en Meta apuntando a `https://tu-dominio/webhook/whatsapp` con tu `META_VERIFY_TOKEN`.
10. Manda un mensaje con una foto de ticket real al número de WhatsApp Business. Esto es la **primera prueba real del sistema completo** — nunca se ha hecho.
11. Observa los logs (`npm run pm2:logs` si usas pm2, o la consola si usas `npm run dev`). Si el driver de OXXO falla en algún campo, revisa los selectores en `server/src/scrapers/oxxo.scraper.ts` contra el HTML real de https://factura.oxxo.com/ y ajústalos — esto es trabajo de ingeniería pendiente, no algo ya resuelto.

## 3. Lo que NO está garantizado

- Que los selectores de OXXO/Costco coincidan con el HTML real de esos portales hoy.
- Que el fallback de Gemini Vision logre completar el formulario sin intervención humana en el primer intento.
- Que la tasa de éxito (`automation_rate`, expuesta en `GET /api/automation-rate`) sea aceptable sin iterar varias veces sobre fallos reales.
- Que Walmart/Starbucks/Zara funcionen — sus drivers son 100% Vision y dependen de que tú configures la URL real de su portal de autofacturación (`MERCHANT_PORTAL_*`), cosa que nadie ha hecho todavía.

## 4. Deploy

Ver `README_DEPLOY.md`.
