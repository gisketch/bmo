## 1. Token Generation Script

- [x] 1.1 Create `scripts/generate-token.js` — reads `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` from env or `.env.local`, generates a JWT for room `bmo-room`, identity `bmo-user`, 30-day TTL, outputs token string
- [x] 1.2 Add `livekit-server-sdk` as a dev dependency in `frontend/package.json` (or keep for build script usage only)

## 2. Agent Persistence

- [x] 2.1 Restructure `agent.py` entrypoint: add `close_on_disconnect=False` to room options, add participant wait loop that greets each new visitor, keep pipeline alive between sessions
- [x] 2.2 Add self-dispatch startup hook: create room `bmo-room` with `empty_timeout=0` + `departure_timeout=0` via LiveKit API, then dispatch agent to it

## 3. Frontend Token Refactor

- [x] 3.1 Update `App.tsx`: replace `TokenSource.endpoint()` with `TokenSource.literal()` using `VITE_LIVEKIT_TOKEN` and `VITE_LIVEKIT_URL` env vars, remove `agentName` from `useSession`
- [x] 3.2 Delete `frontend/server.js` — no longer needed
- [x] 3.3 Remove `VITE_TOKEN_SERVER_URL` references and add `VITE_LIVEKIT_TOKEN` / `VITE_LIVEKIT_URL` to Vite config types

## 4. Deployment Updates

- [x] 4.1 Update `frontend/Dockerfile`: simplify to single-stage Vite build + lightweight static server (`npx serve`), add build args for token generation, remove Express runtime
- [x] 4.2 Update `docker-compose.yml`: add build args for LiveKit credentials to `web` service, remove `env_file` from `web` (no runtime env needed), simplify service config
- [x] 4.3 Copy `prompts/` directory into agent Dockerfile (needed for persistent agent)
