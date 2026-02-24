## ADDED Requirements

### Requirement: Agent process starts memory API
The agent process SHALL start the aiohttp memory API server on port 8484 as a background task alongside the LiveKit agent.

#### Scenario: Agent startup includes API
- **WHEN** `agent.py` starts
- **THEN** the memory API server begins listening on port 8484

### Requirement: Bun serve.ts proxies API requests
The production Bun server SHALL forward any request with path starting with `/api/` to `http://localhost:8484`.

#### Scenario: API request proxied
- **WHEN** a request arrives at Bun serve.ts for path `/api/memories`
- **THEN** the request is forwarded to `http://localhost:8484/api/memories` and the response is relayed back
