## Why

The current per-session agent dispatch model creates a new room and cold-starts the full voice pipeline (VAD + STT + LLM + TTS) every time the user opens the app, causing 5-10 seconds of connection delay. Additionally, the Express token server (`server.js`) occupies a separate port (3001) on the VPS — an unnecessary resource for a single-user personal project.

## What Changes

- **Persistent room**: Use a fixed room name (`bmo-room`) created once with `empty_timeout=0` and `departure_timeout=0` so it never auto-closes.
- **Persistent agent**: Restructure `agent.py` so the agent connects to `bmo-room` once at startup and stays connected forever. When the user joins, the agent greets them immediately (pipeline already warm — no cold start). When the user leaves, the agent remains in the room waiting for the next connection. Includes a watchdog/reconnect loop for crash recovery.
- **Build-time token generation**: Generate a long-lived JWT (1-month TTL) at build time and bake it into the frontend as a Vite environment variable. Eliminates the need for the Express token server entirely.
- **Remove token server**: Delete `server.js` and the token endpoint. Frontend uses `TokenSource.literal()` with the pre-generated token. No `RoomConfiguration` or agent dispatch config needed since the agent is already in the room.
- **Simplified deployment**: The `web` Docker service becomes a pure static file server (no Express, no Node runtime needed in production). **BREAKING**: Port 3001 token server no longer exists.

## Capabilities

### New Capabilities
_None — this change modifies existing capabilities._

### Modified Capabilities
- `agent`: Agent lifecycle changes from per-session dispatch to persistent room connection with reconnect loop. `close_on_disconnect=False` replaces dispatch-based lifecycle.
- `frontend`: Token acquisition changes from `TokenSource.endpoint()` to `TokenSource.literal()` with build-time JWT. Session no longer dispatches agent. Token server requirement removed.
- `deployment`: Token server (`web` service) replaced with static file serving. Build-time token generation added. Room creation with persistence flags added to setup flow.

## Impact

- **agent.py**: Major restructure — persistent connection, participant detection, greeting on join, watchdog loop.
- **frontend/server.js**: Removed entirely.
- **frontend/src/App.tsx**: `TokenSource` and `useSession` usage changes.
- **frontend/package.json**: `livekit-server-sdk` dependency may be removed from runtime (only needed at build time).
- **docker-compose.yml**: `web` service simplified (no Express, possibly nginx or serve).
- **frontend/Dockerfile**: Multi-stage build simplified.
- **Build scripts**: New token generation step added to build/deploy pipeline.
- **Environment variables**: `VITE_TOKEN_SERVER_URL` replaced by `VITE_LIVEKIT_TOKEN` and `VITE_LIVEKIT_URL`.
- **docker-compose.yml**: Updated for deployment — `web` service simplified to static serving, `agent` service updated for persistent connection mode, build-time token generation integrated into build pipeline.
- **frontend/Dockerfile**: Simplified — no Express runtime, just Vite build output served by a lightweight HTTP server (e.g., `serve` or `nginx`).
