# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Build for production
# Pass build-time env vars via ARG
ARG VITE_API_URL=http://localhost:5000
ARG VITE_SOCKET_URL=http://localhost:7000
ARG VITE_MOCK_MODE=false

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_MOCK_MODE=$VITE_MOCK_MODE

RUN npm run build

# ─── Production Stage ──────────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config for SPA routing
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
  location /health { \
    return 200 "ok"; \
    add_header Content-Type text/plain; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
