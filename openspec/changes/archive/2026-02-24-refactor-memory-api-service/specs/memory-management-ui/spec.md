## MODIFIED Requirements

### Requirement: Memory listing API
The system SHALL expose `GET /api/memories` that returns all mem0 memories for user "glenn" as a JSON array, each entry containing `id`, `memory` (text), and `category`. The endpoint SHALL be served by a standalone FastAPI service (not embedded in the agent).

#### Scenario: Valid PIN returns all memories
- **WHEN** client sends `GET /api/memories?pin=4869`
- **THEN** the FastAPI service responds with 200 and JSON body `{ "memories": [...] }` containing every stored memory

#### Scenario: Invalid or missing PIN is rejected
- **WHEN** client sends `GET /api/memories` without a PIN or with wrong PIN
- **THEN** the FastAPI service responds with 401

### Requirement: Memory update API
The system SHALL expose `PUT /api/memories/:id` accepting JSON body `{ "memory": "<new text>" }` and updating the memory through `mem0_client.update()`. The endpoint SHALL be served by a standalone FastAPI service.

#### Scenario: Successful update
- **WHEN** client sends `PUT /api/memories/abc123?pin=4869` with body `{ "memory": "Updated text" }`
- **THEN** the FastAPI service calls `mem0_client.update("abc123", "Updated text")` and responds with 200

#### Scenario: Missing memory text rejected
- **WHEN** client sends `PUT /api/memories/abc123?pin=4869` with empty or missing `memory` field
- **THEN** the FastAPI service responds with 400

### Requirement: API proxy
Both the Vite dev server and the production Bun server SHALL proxy `/api/*` requests to the memory API upstream. In production Docker, the default upstream SHALL be `http://memory-api:8484` (Docker DNS). In development, the default SHALL be `http://localhost:8484`.

#### Scenario: Dev proxy
- **WHEN** frontend fetches `/api/memories?pin=4869` during development
- **THEN** Vite proxies the request to `http://localhost:8484/api/memories?pin=4869`

#### Scenario: Production proxy
- **WHEN** frontend fetches `/api/memories?pin=4869` in production Docker
- **THEN** Bun serve.ts proxies the request to `http://memory-api:8484/api/memories?pin=4869` via the `API_UPSTREAM` environment variable

## ADDED Requirements

### Requirement: PIN persistence in localStorage
The frontend SHALL persist the PIN in `localStorage` after a successful unlock. On page load, if a valid PIN exists in storage, the PIN gate SHALL be skipped. A "Lock" button SHALL clear the stored PIN and return to the PIN gate.

#### Scenario: PIN saved after unlock
- **WHEN** user enters PIN 4869 and the API returns 200
- **THEN** the PIN is saved to `localStorage` under key `bmo-pin`

#### Scenario: PIN auto-loaded on revisit
- **WHEN** user navigates to `/memories` and `localStorage` contains `bmo-pin`
- **THEN** the PIN gate is skipped and memories are fetched immediately using the stored PIN

#### Scenario: Lock button clears PIN
- **WHEN** user clicks the "Lock" button on the memories page
- **THEN** `bmo-pin` is removed from `localStorage` and the PIN gate is displayed
