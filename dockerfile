# syntax=docker/dockerfile:1

# Build stage: compile TypeScript
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV CI=true

# Install dependencies (including devDeps for TypeScript build)
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Copy source and static files
COPY src ./src
COPY public ./public

# Build TypeScript
RUN npm run build

# Ensure cookies file is available in runtime (tsc does not move non-TS assets)



# Runtime stage: production image with ffmpeg and yt-dlp
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install ffmpeg and yt-dlp (static binary)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl python3 \
    && rm -rf /var/lib/apt/lists/* \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app and public assets from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

# Create tmp directory used for 4K merges
RUN mkdir -p /app/tmp_downloads

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.js"]
