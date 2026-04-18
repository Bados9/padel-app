# TODO – ústupky prototypu

Tenhle dokument je **živý seznam** všeho, co vědomě zjednodušujeme / vynecháváme, aby se prototyp co nejdřív dostal do fungovatelného stavu. Každou položku, až se k ní vracíme, přesuneme do příslušného Issue / milníku v GitHubu.

## Bezpečnost & účty

- [ ] **Verifikace emailu při registraci** – v prototypu se účet aktivuje okamžitě
- [ ] **Zapomenuté heslo / reset flow** – není, admin musí heslo změnit ručně
- [ ] **Rate limiting a CAPTCHA** na login/registraci – žádné
- [ ] **2FA / TOTP** – není
- [ ] **Audit log** akcí v adminu – žádný
- [ ] **GDPR tooling** – export uživatele, smazání účtu, retence – není
- [ ] **Content Security Policy** headery – default z Next.js
- [ ] **Session timeout a refresh logika** – JWT cookie default, 30 dní

## Platby

- [ ] **Stripe / GoPay integrace** – v prototypu se neplatí, rezervace jsou zdarma (stub entity `Payment` existuje)
- [ ] **Refund flow**
- [ ] **Webhook handling**
- [ ] **Ceník** – různé ceny prime-time/off-peak/členství

## Rezervace

- [ ] **Opakované rezervace** (každý týden...) – jen jednorázové
- [ ] **Lhůta pro zrušení** – rušit lze kdykoli zdarma
- [ ] **Blackout dny** (svátky, údržba) – admin musí rušit ručně
- [ ] **Waitlist** na obsazené sloty
- [ ] **Minimální předstih rezervace** a **max. dopředná rezervace**
- [ ] **Notifikace** (email / push) – o vytvoření, blížící se rezervaci, přidaném hráči

## Matchmaking

- [ ] **Chat mezi účastníky** otevřené hry – zatím jen owner rezervace a seznam hráčů
- [ ] **Rating / hodnocení hráčů po hře** – jen self-declared level v profilu
- [ ] **Notifikace** když se někdo přidá / odejde

## Admin

- [ ] **Export rezervací / uživatelů** do CSV/XLSX
- [ ] **Reporty** (obsazenost, příjmy, ...)
- [ ] **Více rolí** (manažer, recepce, trenér) – jen USER / ADMIN

## Infrastruktura & provoz

- [ ] **Redis** pro cache/rate-limiting – není v prototypu
- [ ] **Queue / background worker** (emaily, připomenutí)
- [ ] **Monitoring** (Sentry, Grafana) – jen Docker logy
- [ ] **Zálohy DB** – manuální `pg_dump`, není automatické
- [ ] **Strukturované logy** – žádné
- [ ] **Metriky / health endpoint** – jen Docker healthcheck Postgresu
- [ ] **HTTPS** – zatím ne, jedeme přes IP (HTTP); přidáme s doménou
- [ ] **Migrace na Traefik** místo přidávání `location` bloku v beer-app nginx

## Embed / iframe

- [ ] **JS snippet pro auto-resize iframu** (postMessage `{type: "padel-resize", height}`) – zatím jen základní iframe bez auto-resize
- [ ] **Dokumentační stránka `/embed-docs`** s copy-paste příkladem pro kluby
- [ ] **Přepnutí CSP `frame-ancestors` z `*` na whitelist** – teď povolujeme framing odkudkoli kvůli prototypu

## UI / UX

- [ ] **Fotky / ilustrace kurtů** na stránce „Vyber si kurt" (`/rezervace`) – teď jsou karty jen textové. Až bude reálný obsah (foto kurtu z klubu), vrátit hero band s obrázkem nebo galerii; v prototypu úmyslně vypnuto kvůli přehlednosti.
- [ ] **i18n – EN / další jazyky** – nasazeno pouze CS přes next-intl
- [ ] **Dark mode preferencia uživatele** – jen system default
- [ ] **PWA / offline** – ne
- [ ] **Animace a mikrointerakce** – jen základní
- [ ] **Onboarding / tour pro nové uživatele**

## Škálovatelnost & multitenancy

- [ ] **Multi-tenant** (víc klubů) – teď jediná organizace
- [ ] **Víc sportů** s různými kapacitami – teď jen padel (4 hráči)
- [ ] **Různé ceníky per sport**

## Testy

- [ ] **Unit testy** business logiky – žádné
- [ ] **Integrační testy** (Server Actions + DB)
- [ ] **E2E testy** (Playwright)
- [ ] **CI test job** v GitHub Actions
