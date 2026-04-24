#!/usr/bin/env bash
# Spustitelné PŘÍMO NA VPS z adresáře s naklonovaným repo.
# Na lokále a v CI se používá jako `ssh vps "cd /opt/padel-app && ./scripts/deploy.sh"`.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "[deploy] pull…"
git fetch --all --tags
git reset --hard "${DEPLOY_REF:-origin/main}"

echo "[deploy] build image…"
docker compose -f docker-compose.prod.yml build

echo "[deploy] (re)start containers…"
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "[deploy] waiting for app healthy…"
# Testujeme přes docker0 bridge IP (172.17.0.1), kam je app bind.
# 127.0.0.1 se tu už netestuje — po přebindu na 172.17.0.1 tam app neposlouchá.
# Přepisovatelné přes env HEALTHCHECK_HOST pro případ jiné bridge IP na hostu.
HEALTHCHECK_URL="http://${HEALTHCHECK_HOST:-172.17.0.1}:3101${NEXT_PUBLIC_BASE_PATH:-/padel}/"
for i in $(seq 1 30); do
  if curl -sf "$HEALTHCHECK_URL" > /dev/null; then
    echo "[deploy] OK ($HEALTHCHECK_URL)."
    exit 0
  fi
  sleep 2
done

echo "[deploy] ERROR: app nedoběhla za 60 s ($HEALTHCHECK_URL). Logy:" >&2
docker compose -f docker-compose.prod.yml logs --tail=100 app >&2
exit 1
