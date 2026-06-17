# MITAN — Container untuk Spaceship Starlight Hyperlift
# Build TanStack Start sebagai Node SSR server (bukan Cloudflare Worker).

# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies dulu (cache layer)
COPY package*.json bun.lock* bunfig.toml* ./
RUN npm ci

# Copy source dan build dengan preset Node
COPY . .
ENV BUILD_TARGET=node
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Nitro node-server output bersifat self-contained di .output/
COPY --from=builder /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
