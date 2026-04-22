#!/bin/bash
# ============================================================
# Padel-app production deploy na VPS.
# Běží ve stejné VPS jako pivnikonto. Nezasahuje do pivnikonto
# kontejnerů ani nginx — ty řídí deploy.sh pivnikonta.
#
# Běžné použití:
#   cd /var/www/padel-app
#   ./deploy.sh                 # stáhne, buildne, spustí, migruje
#   ./deploy.sh --with-seed     # + naseeduje testovací data
# ============================================================
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
SEED=false

for arg in "$@"; do
  case "$arg" in
    --with-seed) SEED=true ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

echo "🎾 Deploying padel-app..."

if [ ! -f .env ]; then
  echo "❌ .env chybí. Zkopíruj .env.production.example → .env a vyplň hodnoty."
  exit 1
fi

echo "📥 Pulling latest code..."
git checkout -- .
git pull origin main

echo "🐳 Building containers..."
docker compose -f "$COMPOSE_FILE" build

echo "🔄 Starting migrate + app..."
# `up -d` nejdřív vytáhne postgres (healthcheck), pak projede migrate
# (depends_on.service_completed_successfully), pak nastartuje app.
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "⏳ Čekám na app healthy (max 60s)..."
for i in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T app wget -qO- http://127.0.0.1:3000/padel 2>/dev/null | grep -q "<html"; then
    echo "✅ App odpovídá."
    break
  fi
  sleep 2
done

if $SEED; then
  echo "🌱 Seeduji testovací data (admin@padel.local / hrac@padel.local)..."
  # Seed běží z builder image (migrator target) — má plné node_modules včetně tsx.
  docker compose -f "$COMPOSE_FILE" run --rm --entrypoint "" migrate \
    npx tsx prisma/seed.ts
fi

echo ""
echo "✅ Deploy dokončen."
echo "   Localhost: http://127.0.0.1:3101/padel"
echo "   Přes nginx pivnikonta: https://46-225-59-170.sslip.io/padel/"
echo ""
echo "Kontrola logů:  docker compose -f $COMPOSE_FILE logs -f app"
echo "DB shell:       docker compose -f $COMPOSE_FILE exec postgres psql -U padel"
