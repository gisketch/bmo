# Stage 1: Generate token + Build the Vite frontend
FROM node:22-slim AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
COPY scripts/generate-token.mjs ./generate-token.mjs

# Generate LiveKit token at build time
ARG LIVEKIT_API_KEY
ARG LIVEKIT_API_SECRET
ARG LIVEKIT_URL

# Generate token and set as env vars for Vite build
RUN export VITE_LIVEKIT_TOKEN=$(LIVEKIT_API_KEY=$LIVEKIT_API_KEY LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET node generate-token.mjs) && \
    export VITE_LIVEKIT_URL=$LIVEKIT_URL && \
    npm run build

# Stage 2: Production — lightweight static file server
FROM node:22-slim

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["serve", "-s", "dist", "-l", "3001"]
