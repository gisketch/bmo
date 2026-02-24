## Why

The memory API (aiohttp) embedded inside the agent process can't be reached from the web container because the agent uses `network_mode: host` while web uses bridge networking. Extracting it into a standalone FastAPI service on the bridge network eliminates all cross-network issues.

Also adds PIN persistence in localStorage so the user doesn't re-enter it every page load.

## What Changes

- Replace `bmo/memory_api.py` (aiohttp, embedded in agent) with a standalone FastAPI service at `services/memory-api/`.
- Add `memory-api` service to docker-compose on the default bridge network, connecting to Qdrant via Docker DNS.
- Revert agent.py to remove memory API thread startup.
- Remove `aiohttp` from agent's `pyproject.toml`.
- Update `serve.ts` proxy default to `http://memory-api:8484`.
- Frontend saves PIN to localStorage after first successful unlock.

## Capabilities

### New Capabilities

### Modified Capabilities
- `memory-management-ui`: Memory API moves from embedded aiohttp to standalone FastAPI service. Frontend gains PIN persistence via localStorage.
- `deployment`: New `memory-api` docker-compose service; agent no longer hosts the API.

## Impact

- **New files**: `services/memory-api/main.py`, `services/memory-api/Dockerfile`, `services/memory-api/requirements.txt`
- **Removed files**: `bmo/memory_api.py`
- **Modified**: `agent.py` (revert), `pyproject.toml` (remove aiohttp), `docker-compose.yml` (add service, update web env), `serve.ts` (default upstream), `MemoriesPage.tsx` (localStorage PIN), `tests/test_memory_api.py` (rewrite for FastAPI)
