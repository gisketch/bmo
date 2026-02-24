## 1. FastAPI Service

- [x] 1.1 Create `services/memory-api/requirements.txt` with fastapi, uvicorn, mem0ai, qdrant-client
- [x] 1.2 Create `services/memory-api/main.py` — FastAPI app with GET /api/memories, PUT /api/memories/{id}, PIN auth, CORS, Qdrant via env var
- [x] 1.3 Create `services/memory-api/Dockerfile` — Python 3.13-slim, pip install, run uvicorn on 8484

## 2. Docker Compose

- [x] 2.1 Add `memory-api` service to docker-compose.yml (bridge network, depends_on qdrant, env_file, port 8484)
- [x] 2.2 Add `API_UPSTREAM=http://memory-api:8484` environment to web service

## 3. Remove Embedded API

- [x] 3.1 Revert agent.py — remove memory_api import and daemon thread code
- [x] 3.2 Delete `bmo/memory_api.py`
- [x] 3.3 Remove `aiohttp` from pyproject.toml dependencies

## 4. Frontend

- [x] 4.1 Add localStorage PIN persistence to MemoriesPage.tsx (save on unlock, auto-load, Lock button)
- [x] 4.2 Create useSecretCombo hook — tracks Up Up Down Down Left Right Left Right + BigRed sequence, navigates to /memories
- [x] 4.3 Wire combo hook into BmoApp (pass DPad up/down through SecondRow, BigRed press)
- [x] 4.4 Add "BMO" back-navigation button on MemoriesPage

## 5. Tests

- [x] 5.1 Rewrite tests/test_memory_api.py for FastAPI TestClient
