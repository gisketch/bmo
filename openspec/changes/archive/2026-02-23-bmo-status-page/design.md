## Context

BMO currently has decorative Start/Select buttons with no functionality. The agent uses three external AI services (Fish Audio TTS, DeepGram STT, Google Gemini LLM) with no user-visible health monitoring. The frontend connects to a persistent LiveKit room but has no way to display backend service status.

The agent runs as a persistent LiveKit participant in `bmo-room`. The frontend connects via `@livekit/components-react` with a pre-generated token.

## Goals / Non-Goals

**Goals:**
- Surface AI service health (TTS balance, STT balance, LLM usage) on BMO's screen
- Show agent connectivity status (connected, disconnected, error)
- Create a page toggle system triggered by the Start button
- Use Geist Mono for a terminal-aesthetic status display
- Keep the status data pipeline lightweight (LiveKit data channel, not a separate HTTP server)

**Non-Goals:**
- Real-time streaming of balance changes (periodic polling is sufficient)
- Alerting or notifications when balances are low
- Select button functionality (reserved for future use)
- Modifying the agent's AI pipeline behavior based on balance levels

## Decisions

### D1: LiveKit Data Channel for status transport
**Decision**: Use LiveKit's RPC (Remote Procedure Call) mechanism to request status data from the agent, rather than adding an HTTP server to the agent.

**Rationale**: The agent already has a LiveKit room connection. LiveKit's `defineRpcMethod` / `performRpc` gives us request/response semantics over the existing WebRTC connection. No new ports, no CORS, no additional infra.

**Alternative considered**: HTTP endpoint on agent — requires a separate server (aiohttp/FastAPI), port exposure, CORS config, and Docker changes. Overkill for occasional status polling.

### D2: Fish Audio balance via REST API
**Decision**: Fetch from `GET https://api.fish.audio/wallet/self/api-credit` with `Authorization: Bearer <FISH_API_KEY>`. Response contains `credit` field (string, dollar amount).

**Rationale**: Direct official API endpoint. Simple GET request, returns remaining credit balance.

### D3: DeepGram balance via REST API
**Decision**: Fetch from `GET https://api.deepgram.com/v1/projects/{project_id}/balances` with `Authorization: Token <DEEPGRAM_API_KEY>`. Requires first fetching `project_id` from `/v1/projects`. Cache `project_id` after first fetch.

**Rationale**: Official DeepGram API. Note the auth uses `Token` prefix, not `Bearer`.

### D4: Gemini LLM — self-tracked request counter
**Decision**: Google Gemini has no REST API for quota/usage. Track LLM request count locally in the agent process (in-memory counter incremented per LLM call). Report as "N reqs today" with a reset at midnight GMT+8.

**Alternative considered**: Cloud Monitoring API — requires GCP project setup and OAuth, too heavy for this use case.

### D5: Agent connectivity — derived from LiveKit state
**Decision**: Agent connectivity is already available on the frontend via `useAgent()` and `useConnectionState()` from `@livekit/components-react`. No backend work needed for this — it's a frontend-only derivation.

### D6: Page toggle state in BmoLayout
**Decision**: Hold `activePage: 'face' | 'status'` state in `BmoLayout`. Pass it to `Screen` which conditionally renders `Face` or `StatusPage`. Toggle via `onStartPress` callback from `StartSelect`.

### D7: Geist Mono font
**Decision**: Install `geist` npm package. Import `geist/font/mono` CSS. Apply `font-family: 'Geist Mono'` to the StatusPage component.

### D8: Status display format
**Decision**: Terminal-style monospaced text with ASCII progress bars:
```
BMO: Connected
TTS: [||||      ] $2.40
STT: [||||||    ] $4.80
LLM: 142 reqs today
```

Progress bars represent balance as a proportion of an initial/max reference value. If no max is known, show raw dollar amount without bar. Agent status uses the already-available frontend connection state.

### D9: Polling interval
**Decision**: Fetch status via RPC every 30 seconds when the status page is active. Don't poll when on the face page to conserve resources.

## Risks / Trade-offs

- **[Fish Audio API changes]** → The wallet endpoint is undocumented in some versions. Mitigation: Graceful fallback showing "N/A" if the request fails.
- **[DeepGram project_id lookup]** → Requires an extra API call on first fetch. Mitigation: Cache after first successful lookup.
- **[LLM counter resets on agent restart]** → In-memory counter is lost if agent process restarts. Mitigation: Acceptable for a diagnostic display; counter resets are harmless.
- **[RPC availability]** → RPC requires both frontend and agent to be connected. Mitigation: Show "Fetching..." or "N/A" states when RPC fails, and agent connectivity is already shown separately.
