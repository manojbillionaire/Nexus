# cache-bust: v3.4
# ─── Stage 1: Build React Frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Production Backend ────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN addgroup -g 1001 -S nodejs && adduser -S nexus -u 1001
USER nexus

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
