# README_FIRST_INVOICE.md

Cómo generar la **primera factura real** del sistema, de punta a punta, sin pasar por WhatsApp (para poder ver cada paso y cada error directo en tu terminal).

## Requisitos previos

1. Proyecto Supabase real con las 4 tablas creadas (SQL completo en `.env.example`).
2. `server/.env` con `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY` reales (no placeholders).
3. Una foto de un ticket real de OXXO (o Costco) en tu máquina.
4. `cd server && npm install` ya ejecutado.

## Comando

```bash
cd server
npx tsx scripts/first_real_invoice.ts /ruta/a/ticket_oxxo.jpg \
  --rfc=XAXX010101000 \
  --nombre="Juan Pérez" \
  --correo=juan@example.com
```

Si ya tienes un usuario real registrado en la tabla `usuarios` de Supabase, usa su id en vez de los datos fiscales sueltos:

```bash
npx tsx scripts/first_real_invoice.ts /ruta/a/ticket_oxxo.jpg --usuarioId=<uuid-del-usuario>
```

## Qué hace el script, paso a paso

1. Lee la imagen y la manda a `gemini-1.5-flash` con Structured Outputs para extraer comercio, folio, total, fecha, etc. (mismo prompt y schema que usa el servidor real en `server/src/app.ts`).
2. Llama a `resolveDriver(comercio)` (`server/src/drivers/registry.ts`) para encontrar el driver correcto — si el comercio detectado no coincide con ninguno de los registrados (OXXO, Costco, Walmart, Starbucks, Zara), el script se detiene ahí y te dice qué comercios sí soporta.
3. Crea una fila real en la tabla `tickets` de Supabase con los datos extraídos.
4. Ejecuta `driver.ejecutarFacturacion(ticket, usuario)` — esto abre Chromium headless, navega al portal del comercio, llena el formulario (selectores CSS o Gemini Vision según el caso) y descarga XML + PDF a una carpeta temporal.
5. Imprime las rutas locales del XML y PDF generados, y actualiza el `status` del ticket en Supabase (`facturado` o `error`).

## Qué esperar la primera vez

**Esto nunca se ha corrido contra un portal real.** Lo más probable en el primer intento:

- Si el comercio es OXXO/Costco: el selector CSS rápido probablemente falle (porque nunca se verificó contra el HTML real), y el sistema debería caer automáticamente al fallback de Gemini Vision. Obsérvalo en los logs de consola (`runStage` imprime cada etapa).
- Si Vision tampoco logra completar el formulario: el script termina con `❌ Falló la facturación: <mensaje>` y el `error_message` queda guardado en la fila del ticket en Supabase — ahí está la pista de qué ajustar en `server/src/scrapers/oxxo.scraper.ts` (o `costco.scraper.ts`).
- Si el comercio es Walmart/Starbucks/Zara: el script falla inmediatamente con un mensaje claro si no configuraste `MERCHANT_PORTAL_<NOMBRE>` en `.env` — esto es intencional, no un bug.

## Después de la primera corrida exitosa

Revisa en Supabase:
- Tabla `tickets`: el registro debe tener `status = facturado`, `xml_url`/`pdf_url` (si decides subirlos a Storage — el script actual solo los deja en disco local, ver nota abajo).
- Tabla `automation_events`: debe haber 2 filas para ese ticket (`started`, luego `success` o `error`).
- Tabla `driver_selectors`: si Vision tuvo que intervenir, debe haber quedado guardado el selector que usó — la próxima corrida debería ser más rápida (fast path) en ese campo.

## Nota: este script no sube a Storage ni manda WhatsApp/correo

A propósito: es una herramienta de diagnóstico para validar el driver de principio a fin sin depender de Meta ni de buckets de Storage. El flujo completo (subida a Storage + envío por WhatsApp/correo) ya está implementado en `server/src/app.ts` (`billingExecutionWorker`) y se activa solo, una vez que confirmes que el driver funciona, vía el flujo real de WhatsApp.
