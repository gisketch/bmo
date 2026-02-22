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

### Agent Deployment
- Dockerfile builds agent with `uv`
- Downloads model files at build time
- Runs `agent.py start` in production mode
- Health check on port 8081

## Setup Scripts
- `scripts/setup-dev.sh` — one-time dev server setup
- `scripts/setup-prod.sh` — one-time production setup with TLS

## Firewall Ports
| Port | Protocol | Purpose |
|------|----------|---------|
| 80 | TCP | TLS certificate issuance |
| 443 | TCP | HTTPS + TURN/TLS |
| 7880 | TCP | LiveKit WebSocket (dev only) |
| 7881 | TCP | WebRTC over TCP |
| 3478 | UDP | TURN/UDP |
| 50000-60000 | UDP | WebRTC media |
