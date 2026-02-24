# Deployment Domain Spec

## Overview
Self-hosted LiveKit infrastructure on HostHatch VPS (12GB RAM, AMD EPYC). IP: `188.209.141.228`.

## Infrastructure

### LiveKit Server
- Docker container: `livekit/livekit-server`
- **MUST** use `--network host` (NOT port mapping — Docker iptables rules for 10k UDP ports causes hangs)
- Modes:
  - **Dev**: `--dev --bind 0.0.0.0` flag, no TLS, placeholder auth (`devkey`/`secret`), port 7880
  - **Prod**: Docker Compose with Caddy (TLS) + Redis, ports 80/443

### Reverse Proxy
- Caddy with Layer 4 TLS routing
- Auto TLS via Let's Encrypt
- Routes: main domain → LiveKit, TURN domain → TURN server

### Web Service
- Serves pre-built Vite frontend as static files (no Express server)
- Uses Bun to serve static files on port 3001 (web image runs `bun frontend/serve.ts`)
- LiveKit token generated at build time via `scripts/generate-token.mjs` (executed with Bun) and baked into the Vite bundle
- Build args: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`

### Agent Deployment
- Dockerfile builds agent with `uv`
- Downloads model files at build time
- Runs `agent.py start` in production mode
- Health check on port 8081
- Uses `network_mode: host` to avoid Docker iptables issues with LiveKit UDP ports
- Uses `restart: unless-stopped` for auto-recovery from crashes

## Build-Time Token Generation
The project SHALL include a token generation script (`scripts/generate-token.mjs`) that creates a LiveKit JWT with `roomJoin` grant for room `bmo-room`, identity `bmo-user`, and 30-day TTL. This script SHALL be invoked during the frontend Docker build to produce the `VITE_LIVEKIT_TOKEN` environment variable.

## Setup Scripts
- `scripts/setup-dev.sh` — one-time dev server setup
- `scripts/setup-prod.sh` — one-time production setup with TLS

## Firewall Ports
The VPS firewall SHALL expose the following ports. Port 7880 MUST also accept connections from the frontend's browser for WebSocket signaling. The actual VPS host URL is configured via `LIVEKIT_URL` in `.env.local` and SHALL NOT be hardcoded in source files.

| Port | Protocol | Purpose |
|------|----------|---------|
| 80 | TCP | TLS certificate issuance |
| 443 | TCP | HTTPS + TURN/TLS |
| 7880 | TCP | LiveKit WebSocket (dev — browser + agent) |
| 7881 | TCP | WebRTC over TCP |
| 3478 | UDP | TURN/UDP |
| 50000-60000 | UDP | WebRTC media |
