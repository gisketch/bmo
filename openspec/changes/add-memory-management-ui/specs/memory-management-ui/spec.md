## ADDED Requirements

### Requirement: Memory listing API
The system SHALL expose `GET /api/memories` that returns all mem0 memories for user "glenn" as a JSON array, each entry containing `id`, `memory` (text), and `category`.

#### Scenario: Valid PIN returns all memories
- **WHEN** client sends `GET /api/memories?pin=4869`
- **THEN** server responds with 200 and JSON body `{ "memories": [...] }` containing every stored memory

#### Scenario: Invalid or missing PIN is rejected
- **WHEN** client sends `GET /api/memories` without a PIN or with wrong PIN
- **THEN** server responds with 401

### Requirement: Memory update API
The system SHALL expose `PUT /api/memories/:id` accepting JSON body `{ "memory": "<new text>" }` and updating the memory through `mem0_client.update()`.

#### Scenario: Successful update
- **WHEN** client sends `PUT /api/memories/abc123?pin=4869` with body `{ "memory": "Updated text" }`
- **THEN** server calls `mem0_client.update("abc123", "Updated text")` and responds with 200

#### Scenario: Missing memory text rejected
- **WHEN** client sends `PUT /api/memories/abc123?pin=4869` with empty or missing `memory` field
- **THEN** server responds with 400

### Requirement: PIN authentication
All `/api/memories*` endpoints SHALL require query parameter `pin=4869`. Requests without a valid PIN SHALL receive a 401 response.

#### Scenario: Wrong PIN
- **WHEN** client sends any memory API request with `pin=0000`
- **THEN** server responds with 401

### Requirement: Frontend memories page
The frontend SHALL render a dedicated page at URL path `/memories` that displays all memories grouped by category with inline editing.

#### Scenario: User navigates to /memories
- **WHEN** user opens `/memories` in the browser
- **THEN** the app renders a PIN prompt instead of the BMO face

#### Scenario: Correct PIN entered
- **WHEN** user enters PIN 4869 on the memories page
- **THEN** the page fetches and displays all memories grouped under category headings (Relationships, Preferences, Goals, Personal Facts, Uncategorized)

#### Scenario: User edits a memory
- **WHEN** user modifies a memory's text and confirms the edit
- **THEN** the frontend sends `PUT /api/memories/:id` and reflects the updated text on success

### Requirement: API proxy
Both the Vite dev server and the production Bun server SHALL proxy `/api/*` requests to `http://localhost:8484`.

#### Scenario: Dev proxy
- **WHEN** frontend fetches `/api/memories?pin=4869` during development
- **THEN** Vite proxies the request to `http://localhost:8484/api/memories?pin=4869`

#### Scenario: Production proxy
- **WHEN** frontend fetches `/api/memories?pin=4869` in production
- **THEN** Bun serve.ts proxies the request to `http://localhost:8484/api/memories?pin=4869`
