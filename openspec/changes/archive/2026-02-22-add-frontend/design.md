## Context

The project has a working Python voice agent (`agent.py`) connecting to a self-hosted LiveKit server (dev mode) on VPS. There is no frontend — testing has relied on `meet.livekit.io` and console mode. We need a React frontend that connects to this self-hosted LiveKit instance. The LiveKit server URL is configured via `LIVEKIT_URL` in `.env.local`.

Since we don't use LiveKit Cloud, we cannot use the sandbox `TokenSource`. We need our own token endpoint that mints JWTs using the dev auth credentials (`devkey`/`secret`) and returns them in LiveKit's standard endpoint format.

## Goals / Non-Goals

**Goals:**
- Functional React frontend using LiveKit's official React components
- Local token server that implements the LiveKit token endpoint specification
- Audio visualization, microphone controls, session connect/disconnect
- Works with the existing VPS LiveKit dev server and voice agent

**Non-Goals:**
- Custom UI design or branding (deferred — using LiveKit defaults)
- Production deployment of the frontend (dev-only for now)
- Video support (voice-only agent)
- User authentication (no login — dev mode)

## Decisions

### 1. React + Vite (not Next.js)
**Choice**: Vite with React-TS template
**Rationale**: Simpler setup, no SSR needed for a single-page voice agent UI. The LiveKit quickstart uses Vite. Next.js is overkill for a client-side-only voice app at this stage.
**Alternative**: Next.js starter app — heavier, includes its own API routes for token server, but adds routing/SSR complexity we don't need.

### 2. Standalone Express token server (not embedded)
**Choice**: Small Express server (`frontend/server.js`) that implements the standard LiveKit token endpoint (`POST /getToken`).
**Rationale**: Follows LiveKit's exact endpoint specification. Runs on port 3001 alongside Vite dev server on 5173. Uses `livekit-server-sdk` for token generation. Keeps token logic separate from the React app.
**Alternative**: Next.js API route — would require Next.js. Another option: Python Flask server reusing the existing `livekit-api` package — viable but adds complexity to frontend project.

### 3. TokenSource.endpoint() for session management
**Choice**: Use `TokenSource.endpoint()` pointing to `http://localhost:3001/getToken`, combined with `useSession` hook and `SessionProvider`.
**Rationale**: This is LiveKit's recommended production pattern. The Session API handles token fetching, room connection, and agent dispatch automatically.

### 4. Project structure: `frontend/` subdirectory
**Choice**: All frontend code in `frontend/` at the project root.
**Rationale**: Clear separation from the Python agent codebase. Own `package.json`, own dev server. No interference with `uv`/Python tooling.

## Risks / Trade-offs

- **[CORS]** → Vite dev server on `localhost:5173` needs to call token server on `localhost:3001`. Solved by enabling CORS on the Express server.
- **[No auth in dev]** → Token endpoint has no authentication. Acceptable for dev mode; must be addressed for production.
- **[WebRTC to VPS]** → Browser must reach VPS directly for WebRTC media. This already works (tested via `meet.livekit.io`). Firewall ports 7880/7881/50000-60000 are open on the VPS.
- **[Dev credentials]** → Token server uses hardcoded `devkey`/`secret`. These are LiveKit dev-mode placeholders — not a secret leak.
