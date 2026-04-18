# Padel – rezervační systém

Rezervační systém padelových kurtů s matchmakingem (veřejné rezervace, hledání spoluhráčů podle úrovně).

## Stack

- **Next.js 15** (App Router, Server Actions) + **TypeScript**
- **Tailwind CSS v4** + shadcn/ui *(přidáno v M1)*
- **Prisma** ORM + **PostgreSQL 16** *(přidáno v M1)*
- **Auth.js v5** (credentials – email/heslo) *(přidáno v M1)*
- **next-intl** (zatím jen CS) *(přidáno v M1)*
- **Docker** + **docker-compose** (dev + prod)

## Rychlý start (dev)

Předpoklad: nainstalovaný **Docker** (a Docker Compose v2). Nic jiného na hostu netřeba.

```bash
cp .env.example .env.local
docker compose up --build
```

Aplikace běží na **http://localhost:3100** (jen localhost, aby nekolidovala s jinými projekty na stejném stroji).

PostgreSQL: `localhost:5435`, user/pass/db = `padel`.

### Logy / kontrola stavu

```bash
docker compose logs -f app
docker compose ps
```

### Vypnutí / úklid

```bash
docker compose down              # zachová data v postgres volume
docker compose down -v           # smaže i data
```

## Struktura projektu

```
padel-app/
├── docker/app/Dockerfile        # multi-stage (dev + builder + runner)
├── prisma/                      # [M1] schema + migrace
├── src/
│   ├── app/                     # Next.js App Router
│   ├── components/              # UI komponenty
│   ├── lib/                     # auth, db, utility
│   └── server/                  # Server Actions / use-cases
├── docker-compose.yml           # dev
├── docker-compose.prod.yml      # prod pro VPS
├── docs/nginx-padel.conf        # nginx `location /padel/` snippet pro beer-app
├── scripts/                     # deploy.sh, seed-prod.sh
├── .github/workflows/deploy.yml # CI + SSH deploy
├── .env.example / .env.production.example
└── TODO-PROTOTYPE.md            # seznam záměrných ústupků prototypu
```

## Plán implementace (milníky)

- **M0** – Bootstrap _(hotovo)_
- **M1** – DB schema + Auth (email/heslo) _(hotovo)_
- **M2** – Core booking (kurty, kalendář, rezervace, moje rezervace) _(hotovo)_
- **M3** – Matchmaking (veřejné rezervace + level) _(hotovo)_
- **M4** – Admin UI (dashboard, CRUD kurtů, uživatelé) _(hotovo)_
- **M5** – UI polish + responsive _(hotovo)_
- **M6** – Prod Docker + VPS deploy + GitHub Actions _(hotovo)_

## Deploy (produkce)

V prod Next.js běží s `NEXT_PUBLIC_BASE_PATH=/padel` a vystavuje se na `127.0.0.1:3101`. Routing zajišťuje reverse proxy běžící beer-app nginx (přidaný `location /padel/` blok).

### Prvotní nasazení na VPS

```bash
# 1) klonování na VPS (např. /opt/padel-app)
sudo mkdir -p /opt/padel-app && sudo chown $USER:$USER /opt/padel-app
git clone https://github.com/<owner>/padel-app.git /opt/padel-app
cd /opt/padel-app

# 2) prod env (NEVERSIONOVANÝ)
cp .env.production.example .env
# vyplň POSTGRES_PASSWORD a AUTH_SECRET (openssl rand -base64 32)

# 3) první deploy (build image + up + prisma migrate deploy v entrypointu)
./scripts/deploy.sh

# 4) seed administrátorského účtu + kurtů (jednorázově)
./scripts/seed-prod.sh

# 5) nginx: přidej `docs/nginx-padel.conf` blok do beer-app configu a reloadni
sudo nginx -t && sudo nginx -s reload
```

### Automatický deploy z GitHub Actions

Workflow `.github/workflows/deploy.yml` po pushi do `main`:
1. Verifikuje `typecheck` + `lint`.
2. SSH na VPS a spustí `scripts/deploy.sh` (git pull + rebuild + up -d).

Potřebné GitHub secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PATH` (např. `/opt/padel-app`), volitelně `VPS_PORT`.

### Ruční aktualizace na VPS

```bash
cd /opt/padel-app && ./scripts/deploy.sh
```

## Koexistence s beer-app na stejné VPS

- Bindujeme výhradně na `127.0.0.1` (nikdy veřejné porty)
- Vlastní docker network (`padel_network`), vlastní volume names (`padel_postgres_data`), vlastní compose project name (`padel-app`)
- Žádný zásah do beer-app kontejnerů; v M6 se přidává pouze jeden `location` blok do beer-app nginx configu (reload, ne restart)

## TODO – ústupky prototypu

Viz [TODO-PROTOTYPE.md](./TODO-PROTOTYPE.md).
