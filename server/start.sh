#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: No se encontró $ENV_FILE"
  echo "Copia .env.example a server/.env y completa tus credenciales."
  exit 1
fi

# Validate que las claves críticas estén definidas
missing=()
for key in SUPABASE_URL SUPABASE_SERVICE_KEY OPENAI_API_KEY META_VERIFY_TOKEN META_ACCESS_TOKEN META_PHONE_NUMBER_ID SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM REDIS_URL APP_PORT; do
  val=$(grep "^${key}=" "$ENV_FILE" | cut -d= -f2-)
  if [[ -z "$val" || "$val" == *"TU_"* || "$val" == *"YOUR_"* ]]; then
    missing+=("$key")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo ""
  echo "⚠️  Las siguientes variables no están configuradas en server/.env:"
  for m in "${missing[@]}"; do
    echo "   • $m"
  done
  echo ""
  echo "Edita server/.env con tus credenciales reales y vuelve a correr este script."
  exit 1
fi

# Arrancar Redis si no está corriendo
if ! redis-cli ping &>/dev/null; then
  echo "▶  Iniciando Redis..."
  redis-server --daemonize yes --loglevel warning
  sleep 1
fi

echo "✅ Redis: OK"
echo "▶  Arrancando FacturaBot MX..."
echo ""

cd "$SCRIPT_DIR"
export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)

exec npx tsx --tsconfig tsconfig.json src/app.ts
