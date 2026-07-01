# =============================================================================
# FacturaBot MX — Dockerfile de producción
# Basado en la imagen oficial de Playwright (incluye Chromium + todas las
# dependencias del sistema necesarias para correr headless en contenedores).
# =============================================================================
FROM mcr.microsoft.com/playwright:v1.44.1-jammy AS base

WORKDIR /app

# -----------------------------------------------------------------------------
# Dependencias
# -----------------------------------------------------------------------------
COPY package.json package-lock.json ./
RUN npm ci --omit=dev=false

# -----------------------------------------------------------------------------
# Código fuente y build
# -----------------------------------------------------------------------------
COPY tsconfig.json ./
COPY src ./src

RUN npx tsc -p tsconfig.json

# -----------------------------------------------------------------------------
# Limpieza: quitar devDependencies para reducir tamaño de imagen final
# -----------------------------------------------------------------------------
RUN npm prune --omit=dev

# -----------------------------------------------------------------------------
# Runtime
# -----------------------------------------------------------------------------
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.APP_PORT||3000)+'/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/app.js"]
