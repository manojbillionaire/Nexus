# -------- Stage 1: Build Frontend --------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ .
RUN npm run build


# -------- Stage 2: Production Backend --------
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install --only=production

# Copy backend code
COPY backend/ .

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Railway port
ENV PORT=8080
EXPOSE 8080

CMD ["dumb-init","node","server.js"]
