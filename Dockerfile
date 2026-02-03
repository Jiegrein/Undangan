# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Production
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/package*.json ./
RUN npm install --omit=dev

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./public

ENV DATA_PATH=/home/guests.json
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
