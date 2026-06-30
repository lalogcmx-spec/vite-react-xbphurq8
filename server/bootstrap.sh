#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
cd "$SCRIPT_DIR"

echo "════════════════════════════════════════════"
echo "  FacturaBot MX — Bootstrap automático"
echo "════════════════════════════════════════════"

# 1. Validar .env
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ No existe server/.env. Cópialo desde .env.example y completa tus credenciales."
  exit 1
fi

missing=()
for key in SUPABASE_URL SUPABASE_SERVICE_KEY GEMINI_API_KEY META_VERIFY_TOKEN META_ACCESS_TOKEN META_PHONE_NUMBER_ID SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM REDIS_URL APP_PORT; do
  val=$(grep "^${key}=" "$ENV_FILE" | cut -d= -f2-)
  if [[ -z "$val" || "$val" == *"TU_"* || "$val" == *"YOUR_"* ]]; then
    missing+=("$key")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo ""
  echo "⚠️  Faltan completar estas variables en server/.env:"
  for m in "${missing[@]}"; do echo "   • $m"; done
  echo ""
  exit 1
fi
echo "✅ .env validado"

# 2. Instalar dependencias si hace falta
if [[ ! -d node_modules ]] || [[ package.json -nt node_modules ]]; then
  echo "▶  Instalando dependencias..."
  npm install --no-fund --no-audit
fi
echo "✅ Dependencias instaladas"

# 3. Typecheck
echo "▶  Verificando TypeScript..."
npx tsc --noEmit
echo "✅ TypeScript sin errores"

# 4. Redis: arrancar si no corre, persistir a disco
if ! redis-cli ping &>/dev/null; then
  echo "▶  Iniciando Redis (con persistencia AOF)..."
  redis-server --daemonize yes --loglevel warning --appendonly yes
  sleep 1
fi
echo "✅ Redis: $(redis-cli ping)"

# 5. Logs dir
mkdir -p logs

# 6. PM2: arrancar/recargar el proceso administrado
echo "▶  Arrancando con PM2 (auto-restart habilitado)..."
npx pm2 startOrReload ecosystem.config.cjs --update-env

# 7. Guardar la lista de procesos para que sobreviva reinicios del host
npx pm2 save

# 8. Configurar arranque automático del sistema (systemd/init), si hay permisos
if command -v systemctl &>/dev/null && [[ $(id -u) -eq 0 || -n "${SUDO_USER:-}" ]]; then
  echo "▶  Configurando arranque automático del sistema..."
  npx pm2 startup systemd -u "$(whoami)" --hp "$HOME" 2>&1 | tail -5 || true
else
  echo "ℹ️  Omitiendo 'pm2 startup' (requiere systemd + privilegios). Corre manualmente:"
  echo "    npx pm2 startup"
fi

echo ""
echo "════════════════════════════════════════════"
echo "  ✅ FacturaBot MX corriendo bajo PM2"
echo "════════════════════════════════════════════"
npx pm2 status
echo ""
echo "Comandos útiles:"
echo "  npx pm2 logs facturabot-mx     → ver logs en vivo"
echo "  npx pm2 restart facturabot-mx  → reiniciar"
echo "  npx pm2 stop facturabot-mx     → detener"
echo "  npx pm2 monit                  → dashboard interactivo"
