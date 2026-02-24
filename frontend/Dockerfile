# Stage 1: Generate token + Build the Vite frontend
FROM oven/bun:1 AS build

WORKDIR /app

COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ .
COPY scripts/generate-token.mjs ./generate-token.mjs

# Generate LiveKit token at build time
ARG LIVEKIT_API_KEY
ARG LIVEKIT_API_SECRET
ARG LIVEKIT_URL

# Generate token and set as env vars for Vite build
RUN VITE_LIVEKIT_TOKEN="$(LIVEKIT_API_KEY=$LIVEKIT_API_KEY LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET bun generate-token.mjs)" \
    VITE_LIVEKIT_URL="$LIVEKIT_URL" \
    bun run build

# Stage 2: Production — lightweight static file server
FROM oven/bun:1

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/serve.ts ./serve.ts

EXPOSE 3001

CMD ["bun", "serve.ts"]
