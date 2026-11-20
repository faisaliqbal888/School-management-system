# ─────────────────────────────────────────────────────────────
#  Backend — Express + TypeScript on Node 20 (bookworm-slim)
# ─────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS base
ENV NODE_ENV=production
WORKDIR /app

# ── deps: install workspace-aware, cache-friendly ────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

# ── build: typecheck + emit dist ────────────────────────────
FROM base AS build
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
RUN npm ci --ignore-scripts || npm install --ignore-scripts
COPY backend ./backend
WORKDIR /app/backend
# Prisma client is generated from the schema — no engine download needed.
RUN npm run prisma:generate && npm run build

# ── runtime ─────────────────────────────────────────────────
FROM base AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/package.json ./backend/package.json

# Run as the unprivileged user that ships with the node image.
RUN chown -R node:node /app
USER node

ENV PORT=5000
EXPOSE 5000

# Compose/most PaaS hosts poll this before routing traffic.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

WORKDIR /app/backend
CMD ["node", "dist/server.js"]
