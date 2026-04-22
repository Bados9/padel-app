# Deploy padel-app na VPS

Aplikace běží na stejné VPS jako **pivnikonto** (IP `46.225.59.170`,
doména `46-225-59-170.sslip.io`). Využívá **nginx z pivnikonta** jako reverse
proxy pod path prefixem `/padel/` a stávající Let's Encrypt certifikát.

## Architektura

```
                ┌─────────────────────────────────────────┐
                │  VPS 46.225.59.170                      │
                │                                         │
                │  ┌─ pivnikonto ─────────────────────┐   │
    HTTPS :443  │  │ nginx (80/443) ──► php, adminer  │   │
  ─────────────►│  └──────┬───────────────────────────┘   │
   sslip.io     │         │                               │
                │         │ proxy /padel/                 │
                │         │ host.docker.internal:3101     │
                │         ▼                               │
                │  ┌─ padel-app ──────────────────────┐   │
                │  │ next.js (3101 host) ──► postgres │   │
                │  └──────────────────────────────────┘   │
                └─────────────────────────────────────────┘
```

- **pivnikonto** (existující): nginx + php + postgres + adminer ve síti `pivnikonto`.
- **padel-app** (nové): next.js + postgres + migrate ve síti `padel_prod_network`.
  Postgres bez host portu (jen interně v síti).
  App bindovaná na `127.0.0.1:3101` — dostupná jen z hosta, ne z veřejné IP.
- **Most:** nginx pivnikonta má `extra_hosts: host.docker.internal:host-gateway`
  a proxy_pass `http://host.docker.internal:3101` pro `location /padel/`.

## První nasazení

### 1. Naklonuj repo na VPS

```bash
ssh root@46.225.59.170
cd /var/www
git clone git@github.com:Bados9/padel-app.git   # nebo https://github.com/Bados9/padel-app.git
cd padel-app
```

### 2. Vytvoř produkční `.env`

```bash
cp .env.production.example .env

# Vygeneruj hesla
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)" >> .env
echo "AUTH_SECRET=$(openssl rand -base64 32)"     >> .env

# Dolaď ručně — .env.production.example už má NEXT_PUBLIC_BASE_PATH=/padel,
# ale zkontroluj že v .env není duplicita po appendu.
$EDITOR .env
```

Výsledný `.env` musí obsahovat:

```ini
NEXT_PUBLIC_BASE_PATH=/padel
POSTGRES_PASSWORD=<něco silného>
AUTH_SECRET=<base64 32 bytů>
```

### 3. Build + start kontejnerů

```bash
./scripts/deploy.sh      # pull + build + up -d + healthcheck
./scripts/seed-prod.sh   # POUZE PŘI PRVNÍM NASAZENÍ – vytvoří admina a kurty
```

`scripts/deploy.sh`:
1. `git fetch + reset --hard origin/main` (cílový ref lze přepnout přes `DEPLOY_REF`)
2. `docker compose -f docker-compose.prod.yml build`
3. `... up -d --remove-orphans` → postgres → migrate (čeká healthcheck) → app
4. Healthcheck `curl http://127.0.0.1:3101/padel/` (do 60 s)

`scripts/seed-prod.sh` spustí Prisma seed v migrator kontejneru — bezpečné re-run
(upsert), ale obvykle jen poprvé. Seeduje testovací účty:
- `admin@padel.local` / `admin123`
- `hrac@padel.local` / `hrac123`

Další deploy už pak jen:
```bash
./scripts/deploy.sh
```

Ověření:
```bash
curl -I http://127.0.0.1:3101/padel/
# → HTTP/1.1 200 OK (nebo 307 na login)
```

### 4. Zapnout proxy v nginx pivnikonta

Toto je jediná změna mimo `padel-app` repo. Viz `feature/padel-proxy` větev
na `Bados9/pivni-konto`. Shrnutí:

**a) `docker-compose.prod.yml` — přidat `extra_hosts` do služby `nginx`:**

```yaml
services:
  nginx:
    # ...
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

**b) `docker/nginx/prod-ssl.conf` — přidat location blok PŘED `location /`:**

```nginx
# Padel-app
set $padel_upstream host.docker.internal:3101;

location /padel/ {
    proxy_pass http://$padel_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 60s;
    proxy_buffering off;
}

location = /padel {
    return 301 /padel/;
}
```

Na VPS:
```bash
cd /var/www/pivnikonto
git fetch origin
git checkout feature/padel-proxy       # nebo merge do master
docker compose -f docker-compose.prod.yml up -d nginx   # reload
```

### 5. Ověř v prohlížeči

- https://46-225-59-170.sslip.io/padel/ — padel landing
- https://46-225-59-170.sslip.io/        — pivnikonto SPA (nezměněno)

## Opakovaný deploy (update kódu)

**Automaticky přes GitHub Actions** (doporučeno):
- Každý merge do `main` spustí `.github/workflows/deploy.yml`:
  `verify` job (typecheck + lint) → `deploy` job (SSH na VPS + `scripts/deploy.sh`)
- Vyžaduje secrets v repu — viz níže sekce „Auto-deploy přes GitHub Actions".

**Ručně na VPS** (fallback):
```bash
ssh root@46.225.59.170
cd /var/www/padel-app
./scripts/deploy.sh
```

## Auto-deploy přes GitHub Actions

Workflow `.github/workflows/deploy.yml` je připravený, ale potřebuje 4 secrets
na `Bados9/padel-app` → Settings → Secrets and variables → Actions.
**Naming je sladěný s pivnikonto repem** (stejná pojmenovací konvence):

| Secret | Hodnota | Poznámka |
|---|---|---|
| `SSH_HOST` | `46.225.59.170` | Stejné jako pivnikonto |
| `SSH_USER` | `padel` | Samostatný linux user (izolace od pivnikonto) |
| `SSH_PORT` | `22` | Dle konfigurace VPS |
| `SSH_PRIVATE_KEY` | **Privátní** SSH klíč (celý PEM včetně BEGIN/END řádků) | Deploy key pod userem `padel` |

Deploy path je hardcoded ve workflow (`/home/padel/padel-app`), stejný pattern
jako pivnikonto (`/var/www/pivnikonto`).

**Vygeneruj deploy key pod uživatelem `padel` přímo na VPS**:
```bash
ssh root@46.225.59.170
su - padel
ssh-keygen -t ed25519 -C "padel-deploy@github-actions" -f ~/.ssh/padel_deploy -N ""
cat ~/.ssh/padel_deploy.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/padel_deploy    # celý výstup nahraj jako SSH_PRIVATE_KEY secret
```

Po přidání secrets: další push do `main` spustí CI. Sleduj na:
https://github.com/Bados9/padel-app/actions

## Troubleshooting

**502 Bad Gateway přes nginx**
- `docker logs padel-app-prod` — app běží?
- `curl -I http://127.0.0.1:3101/padel` — přímo z hosta odpovídá?
- `docker exec pivnikonto-nginx-1 getent hosts host.docker.internal` —
  vrací IP (typicky `172.17.0.1`)? Pokud ne, chybí `extra_hosts`.

**Migrace selhaly**
- `docker logs padel-app-migrate` ukáže chybu.
- Fix schématu → PR → merge → CI → deploy. V nouzi ručně:
  `docker compose -f docker-compose.prod.yml run --rm migrate`.

**Heslo k DB**
```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U padel
```

**Reset DB (POZOR, smaže data)**
```bash
docker compose -f docker-compose.prod.yml down
docker volume rm padel-app_padel_postgres_data_prod
./scripts/deploy.sh
./scripts/seed-prod.sh
```

## Bezpečnost

- Postgres ani app nejsou vystaveny na veřejné IP.
- DB heslo a `AUTH_SECRET` jsou jen v `.env` na VPS (mimo Git).
- `AUTH_TRUST_HOST=true` + správné `X-Forwarded-*` hlavičky z nginxu →
  NextAuth dostane skutečný HTTPS origin a vygeneruje správné callbacky.
- CSP `frame-ancestors *;` je povolená kvůli embed módu (prototyp);
  později zúžit přes `IFRAME_ALLOWED_ORIGINS` v `.env`.
