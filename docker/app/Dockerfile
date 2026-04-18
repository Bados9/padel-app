# ---------- base ----------
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---------- deps (cached layer) ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- dev (hot-reload) ----------
FROM base AS dev
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
# Sladit UID/GID s hostem, aby soubory vytvářené v kontejneru byly
# pro hosta editovatelné. Default 1000 (node image default).
ARG UID=1000
ARG GID=1000
RUN deluser --remove-home node 2>/dev/null || true \
 && addgroup -S -g ${GID} app \
 && adduser  -S -u ${UID} -G app app \
 && mkdir -p /app/.next /app/node_modules \
 && chown -R app:app /app
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
USER app
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---------- builder (production compile) ----------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
RUN npx prisma generate && npm run build

# ---------- runner (minimal prod image) ----------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

# ---------- migrator (jednorázové `prisma migrate deploy` / `db seed`) ----------
# Má plné node_modules z builderu, takže prisma CLI funguje i s tranzitivními deps.
FROM builder AS migrator
ENV NODE_ENV=production
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]
