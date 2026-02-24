## Context

The memory API was initially embedded in the agent process using aiohttp, started in a daemon thread. This doesn't work in Docker because the agent container uses `network_mode: host` (required for LiveKit UDP) while the web container runs on the bridge network. Cross-network connectivity from bridge → host is blocked by iptables on the VPS.

## Goals / Non-Goals

**Goals:**
- Standalone FastAPI service on Docker bridge network, reachable by the web container via Docker DNS (`memory-api:8484`).
- Same API surface: GET /api/memories, PUT /api/memories/:id, PIN-protected.
- Connects to Qdrant via Docker DNS (`qdrant:6333`).
- Frontend persists PIN in localStorage after successful unlock.
- Clean removal of all embedded API code from the agent.

**Non-Goals:**
- No new API endpoints beyond list + update.
- No pagination or search.
- No auth beyond PIN.

## Decisions

### 1. FastAPI over aiohttp
FastAPI is simpler for a standalone service (auto OpenAPI docs, dependency injection, Pydantic). Single file `main.py`.

### 2. Separate requirements.txt (not shared pyproject.toml)
The memory-api service has minimal deps (fastapi, uvicorn, mem0ai, qdrant-client). No reason to share the agent's heavy dependency tree.

### 3. Qdrant host configured via env var
Default `QDRANT_HOST=qdrant` for Docker DNS. Override to `localhost` for local dev.

### 4. PIN persisted in localStorage
After successful API response (200 from /api/memories), save PIN to `localStorage`. On page load, check localStorage first — skip the PIN gate if present. A "Lock" button clears it.

## Risks / Trade-offs

- **[Risk] mem0 re-initialized in separate process** → Acceptable; mem0 is stateless, just needs Qdrant + embedder config.
- **[Risk] Separate container = more resources** → Minimal — FastAPI + uvicorn is lightweight.
