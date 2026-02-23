## ADDED Requirements

### Requirement: Agent registers getStatus RPC method
The agent SHALL register a LiveKit RPC method named `getStatus` on the room participant. When invoked, it SHALL concurrently fetch Fish Audio credit balance (`GET https://api.fish.audio/wallet/self/api-credit` with `Authorization: Bearer <FISH_API_KEY>`) and DeepGram project balance (`GET https://api.deepgram.com/v1/projects/{project_id}/balances` with `Authorization: Token <DEEPGRAM_API_KEY>`). It SHALL return a JSON string containing `tts_balance` (number or null), `stt_balance` (number or null), and `llm_requests_today` (integer).

#### Scenario: Successful status fetch
- **WHEN** the frontend calls `getStatus` via RPC
- **THEN** the agent responds with a JSON string like `{"tts_balance": 2.40, "stt_balance": 4.80, "llm_requests_today": 142}`

#### Scenario: Fish Audio API failure
- **WHEN** the Fish Audio balance fetch fails
- **THEN** the agent responds with `tts_balance: null` and other fields remain populated

#### Scenario: DeepGram API failure
- **WHEN** the DeepGram balance fetch fails
- **THEN** the agent responds with `stt_balance: null` and other fields remain populated

### Requirement: Agent tracks LLM request count
The agent SHALL maintain an in-memory counter of LLM requests made during the current day (GMT+8). The counter SHALL reset to 0 when the date changes (midnight GMT+8). The counter SHALL increment each time the LLM processes a request.

#### Scenario: Counter increments on LLM use
- **WHEN** the agent's LLM processes a conversation turn
- **THEN** the request counter increments by 1

#### Scenario: Counter resets at midnight
- **WHEN** the current GMT+8 date changes from the date of the last recorded request
- **THEN** the counter resets to 0 before incrementing

### Requirement: DeepGram project ID caching
The agent SHALL cache the DeepGram project ID after the first successful lookup from `GET https://api.deepgram.com/v1/projects`. Subsequent balance fetches SHALL reuse the cached project ID without re-fetching.

#### Scenario: First balance fetch
- **WHEN** the agent fetches DeepGram balance for the first time
- **THEN** it first calls the projects endpoint, caches the project ID, then fetches balances

#### Scenario: Subsequent balance fetch
- **WHEN** the agent fetches DeepGram balance after the first time
- **THEN** it uses the cached project ID directly
