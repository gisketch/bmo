## Context

BMO's mem0 memories live in Qdrant (collection auto-managed by mem0). The agent process (`agent.py`) already initialises `mem0_client` at import time via `bmo.config`. There is no HTTP API for memory CRUD today — only the Python client.

The frontend is a React SPA served by Bun (`serve.ts`). It currently has two "pages" toggled via state (`face` | `status`). Routing is implicit — `serve.ts` falls back to `index.html` for any HTML request.

## Goals / Non-Goals

**Goals:**
- Browse all mem0 memories categorised by `MemoryCategory` from the frontend.
- Edit memory text in-place with changes persisted through `mem0_client.update()`.
- PIN gate (hardcoded `4869`) — no auth framework.
- Keep the API minimal: list + update only.

**Non-Goals:**
- Delete or create memories from the UI (use backfill script or voice).
- User management / multi-user access.
- Pagination (memory count is small — hundreds, not thousands).
- Full auth system (PIN is sufficient for personal use).

## Decisions

### 1. Python aiohttp API server co-located in agent process
Run a small aiohttp web server on port 8484 inside the same process as the LiveKit agent. It reuses the existing `mem0_client` singleton.

**Why not Bun/TS → Qdrant directly?** mem0 wraps Qdrant with its own schema; `update()` re-embeds the text automatically. Going through mem0 keeps embeddings consistent.

**Why aiohttp?** Lightweight, async-native, no heavy framework. Single file `bmo/memory_api.py`.

### 2. PIN via query parameter
`GET /api/memories?pin=4869`, `PUT /api/memories/:id?pin=4869`. Simple, no cookie/session overhead. Acceptable for a personal single-user tool.

### 3. Frontend: path-based route detection
Check `window.location.pathname` on mount. If `/memories`, render `MemoriesPage` instead of the BMO face. No react-router dependency — just conditional rendering.

### 4. Proxy through serve.ts and Vite
Both the production Bun server and the Vite dev server proxy `/api/*` → `http://localhost:8484`. Frontend code always fetches `/api/...` (relative).

### 5. Category grouping
Group by `metadata.category`. Memories without a category go under "uncategorized".

## Risks / Trade-offs

- **[Risk] aiohttp dependency added** → Minimal footprint; only used for this API. Could be replaced by stdlib if needed.
- **[Risk] PIN in query string visible in logs** → Acceptable for personal tool on private network.
- **[Risk] mem0 `get_all` returns flat list** → Client-side grouping is trivial at current scale.
