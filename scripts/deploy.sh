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
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:3101${NEXT_PUBLIC_BASE_PATH:-/padel}/" > /dev/null; then
    echo "[deploy] OK."
    exit 0
  fi
  sleep 2
done

echo "[deploy] ERROR: app nedoběhla za 60 s. Logy:" >&2
docker compose -f docker-compose.prod.yml logs --tail=100 app >&2
exit 1
