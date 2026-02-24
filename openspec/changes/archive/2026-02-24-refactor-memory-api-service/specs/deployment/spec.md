## ADDED Requirements

### Requirement: Memory API runs as standalone Docker service
The memory API SHALL run as a standalone FastAPI service (`memory-api`) in docker-compose on the default bridge network, connecting to Qdrant via Docker DNS (`qdrant:6333`).

#### Scenario: Memory API service starts
- **WHEN** `docker compose up` is run
- **THEN** the `memory-api` service starts on port 8484, connects to Qdrant at `qdrant:6333`, and is reachable by the web container at `http://memory-api:8484`

#### Scenario: Web container proxies to memory API
- **WHEN** the web container receives a request for `/api/memories`
- **THEN** it forwards the request to `http://memory-api:8484` via the `API_UPSTREAM` environment variable

## MODIFIED Requirements

### Requirement: Bun serve.ts proxies API requests
The production Bun server SHALL forward any request with path starting with `/api/` to the upstream defined by `API_UPSTREAM` environment variable (default: `http://memory-api:8484` in Docker).

#### Scenario: API request proxied
- **WHEN** a request arrives at Bun serve.ts for path `/api/memories`
- **THEN** the request is forwarded to `${API_UPSTREAM}/api/memories` and the response is relayed back
