#!/usr/bin/env bash
# Jednorázový seed pro čerstvou prod DB. Spusť na VPS po prvním `deploy.sh`.
# Vytvoří admina a základní kurty. Další spuštění jen upsertují – bezpečné.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "[seed] spouštím db seed přes migrator image…"
docker compose -f docker-compose.prod.yml run --rm --no-deps \
  --entrypoint "" \
  migrate node node_modules/prisma/build/index.js db seed
