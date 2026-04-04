# ============================================================
# AdminToolbox — Production Docker Image
# Stage 1: Vite frontend build
# Stage 2: Lean Node.js production image
# ============================================================

# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
# NODE_ENV=development ensures devDependencies (vite) are installed
# Coolify injects ARG NODE_ENV=production which would skip them otherwise
RUN NODE_ENV=development npm ci

COPY . .
RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY --from=builder /app/dist ./dist

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "server/index.js"]
