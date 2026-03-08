# ─── Stage 1: Build React Frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build && echo "✅ Frontend built" && ls -la dist/

# ─── Stage 2: Production Backend ────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend into correct location
COPY --from=frontend-builder /build/dist ./frontend/dist

# Verify files exist
RUN echo "✅ Checking frontend/dist:" && ls -la frontend/dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nexus -u 1001
USER nexus

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
