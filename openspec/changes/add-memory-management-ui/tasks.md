## 1. Backend API

- [x] 1.1 Add `aiohttp` to `pyproject.toml` dependencies
- [x] 1.2 Create `bmo/memory_api.py` with GET /api/memories and PUT /api/memories/:id endpoints (PIN-protected)
- [x] 1.3 Start memory API server from `agent.py` as a background task
- [x] 1.4 Add basic API tests in `tests/test_memory_api.py`

## 2. Proxy Layer

- [x] 2.1 Update `frontend/serve.ts` to proxy `/api/*` to `http://localhost:8484`
- [x] 2.2 Update `frontend/vite.config.ts` with dev proxy for `/api/*`

## 3. Frontend Memories Page

- [x] 3.1 Add `MemoriesPage` component with PIN gate and categorized memory list
- [x] 3.2 Add inline editing support for each memory item
- [x] 3.3 Update `App.tsx` to route `/memories` path to MemoriesPage
- [x] 3.4 Update `BmoPage` type in `types/bmo.ts` — N/A, `/memories` is a standalone route
