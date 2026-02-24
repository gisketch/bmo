## Why

BMO stores long-term memories in Qdrant (via mem0) but there's no way to view, verify, or correct them. A frontend memory browser lets the user inspect what BMO "knows" and fix inaccuracies directly.

## What Changes

- Add a PIN-protected `/memories` frontend route that lists all mem0 memories grouped by category (relationships, preferences, goals, personal_facts).
- Each memory's text is inline-editable; saves propagate back through mem0's `update()` so embeddings stay in sync.
- A lightweight Python HTTP API (`bmo/memory_api.py`, aiohttp, port 8484) wraps `mem0_client` for list + update operations.
- The API server starts as a side-task inside `agent.py`.
- Bun `serve.ts` and Vite dev server proxy `/api/*` to the Python API.

## Capabilities

### New Capabilities
- `memory-management-ui`: Frontend page for browsing and editing mem0 memories, plus the backing HTTP API.

### Modified Capabilities
- `frontend`: New `/memories` route and proxy configuration for API calls.
- `deployment`: `serve.ts` gains `/api/*` proxy; `agent.py` starts the memory API alongside the LiveKit agent.

## Impact

- **Backend**: New file `bmo/memory_api.py`; `agent.py` starts the API server; `aiohttp` added to `pyproject.toml`.
- **Frontend**: New `MemoriesPage` component, PIN gate, route handling in `App.tsx`; `serve.ts` proxies API.
- **Vite config**: Dev proxy for `/api/*`.
- **Docker**: No new services — API runs inside the existing `agent` container.
