# Deploy a Railway — FacturaBot MX

Este servidor está listo para desplegarse en Railway con Chromium funcional
(usa la imagen oficial `mcr.microsoft.com/playwright`, que ya trae todas las
dependencias del sistema operativo que Chromium necesita en un contenedor).

## 1. Crear el proyecto en Railway

```bash
npm install -g @railway/cli
railway login
cd server
railway init
```

## 2. Agregar Redis como servicio

En el dashboard de Railway: **New** → **Database** → **Add Redis**.
Railway inyecta automáticamente `REDIS_URL` en las variables del proyecto —
no la pongas manualmente, solo asegúrate de que el servicio de la app y el
de Redis estén en el mismo proyecto/environment.

## 3. Configurar variables de entorno

En el dashboard del servicio de la app (Settings → Variables), agrega:

```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
GEMINI_API_KEY=...
META_VERIFY_TOKEN=...
META_ACCESS_TOKEN=...
META_PHONE_NUMBER_ID=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
APP_PORT=3000
NODE_ENV=production
```

`REDIS_URL` la pone Railway solo al conectar el servicio Redis.
**No** definas `CHROMIUM_PATH` — la imagen de Playwright ya expone el
Chromium correcto vía `PLAYWRIGHT_BROWSERS_PATH`, y el scraper lo detecta
automáticamente si `CHROMIUM_PATH` no está definida.

## 4. Deploy

```bash
railway up
```

Railway construye con el `Dockerfile` de este directorio (ya configurado en
`railway.json` con `DOCKERFILE` builder) y expone un dominio público HTTPS.

## 5. Configurar el webhook de Meta con la URL fija

Una vez desplegado, Railway te da un dominio del tipo
`https://facturabot-mx-production.up.railway.app`. En el Meta Developer
Console:

- **Callback URL**: `https://TU-DOMINIO.up.railway.app/webhook/whatsapp`
- **Verify Token**: el mismo valor que pusiste en `META_VERIFY_TOKEN`

Esta URL ya no cambia — a diferencia de ngrok, queda fija mientras el
proyecto exista en Railway.

## 6. Verificar que está vivo

```bash
curl https://TU-DOMINIO.up.railway.app/health
# {"status":"ok","timestamp":"..."}
```

## 7. Logs en vivo

```bash
railway logs
```

---

## Por qué esto resuelve el problema del scraper

El contenedor de Railway tiene salida real a internet (a diferencia de un
sandbox de desarrollo restringido). Eso permite:

1. Verificar en vivo si `costco.com.mx/facturacion` carga correctamente
2. Capturar el HTML/selectores reales del formulario con
   `railway run -- node -e "..."` o revisando los `error_message` que el
   ticket guarda en Supabase cuando el scraper falla
3. Iterar el archivo `src/scrapers/costco.scraper.ts` contra el sitio real
   hasta que el flujo de facturación funcione de punta a punta

**El scraper actual (`costco.scraper.ts`) usa selectores genéricos como
mejor esfuerzo, pero no ha sido validado contra el portal real de Costco.**
El primer ticket real que se intente facturar muy probablemente fallará en
el paso de búsqueda de selectores — en ese punto, revisa `ticket.error_message`
en Supabase o los logs de Railway para ver en qué selector se atoró, y
ajusta `costco.scraper.ts` con los valores reales observados.
