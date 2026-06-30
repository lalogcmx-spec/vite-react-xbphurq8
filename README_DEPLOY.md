# README_DEPLOY.md

## Documento canónico de deploy

El deploy detallado a Railway ya está escrito en `server/DEPLOY.md` — léelo completo, este archivo es solo el resumen y el checklist de verificación. No se duplica el contenido para evitar que se desincronicen.

## Resumen del flujo

```bash
npm install -g @railway/cli
railway login
cd server
railway init
# Dashboard → New → Database → Add Redis (en el mismo proyecto)
# Dashboard → Settings → Variables: pega las 13 env vars obligatorias (NO pongas REDIS_URL, Railway la inyecta)
railway up
```

Railway construye con `server/Dockerfile` (imagen base `mcr.microsoft.com/playwright:v1.44.1-jammy`, ya trae Chromium + libs del sistema) según `server/railway.json`.

## Verificación post-deploy

```bash
curl https://TU-DOMINIO.up.railway.app/health
# esperado: {"status":"ok","timestamp":"..."}

curl https://TU-DOMINIO.up.railway.app/api/automation-rate
# esperado: {"merchants":[...],"rates":[]}  (vacío hasta que se procese el primer ticket)
```

Configura el webhook de WhatsApp en Meta Developer Console apuntando a `https://TU-DOMINIO.up.railway.app/webhook/whatsapp`.

## Estado real de este paso

**Nunca se ha ejecutado `railway up` ni se ha desplegado este proyecto a ningún entorno fuera de este sandbox.** Todo lo de arriba es el procedimiento correcto según la configuración existente (`Dockerfile`, `railway.json`, `ecosystem.config.cjs` ya están en el repo y son válidos), pero el primer despliegue real, con sus posibles errores de build/runtime específicos de Railway, todavía está pendiente.

## Alternativa: Docker Compose local (sin Railway)

```bash
cd server
cp .env.example .env   # llenar con credenciales reales
docker compose up --build
```

Esto levanta Redis + la app en un contenedor local, útil para probar el flujo completo antes de pagar por Railway. Tampoco se ha ejecutado nunca en este sandbox (no hay Docker disponible aquí).

## Producción con PM2 (alternativa sin contenedores, en una VM propia)

```bash
cd server
npm install
npm run build
npm run pm2:start    # usa ecosystem.config.cjs
npm run pm2:logs
```
