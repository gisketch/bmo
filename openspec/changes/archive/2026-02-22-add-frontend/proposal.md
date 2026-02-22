## Why

The voice agent backend is fully operational (STT → LLM → TTS pipeline with tool calls), but there is no custom frontend. Testing currently relies on `meet.livekit.io` or console mode. A dedicated React frontend is needed to provide a controllable, self-hosted UI that connects to the VPS-hosted LiveKit server and the voice agent.

## What Changes

- Add a React + Vite frontend app in `frontend/` directory
- Add a token server (Next.js API route or standalone Express) that mints JWT tokens using the LiveKit API key/secret — required because we self-host (no LiveKit Cloud sandbox)
- Use LiveKit's `@livekit/components-react` and `@livekit/components-styles` for session management, audio visualization, and controls
- Use `TokenSource.endpoint()` to connect the frontend to the self-hosted token server
- Configure CORS to allow the local dev frontend to reach the VPS LiveKit server
- Add `frontend` domain spec to track frontend requirements

## Capabilities

### New Capabilities
- `frontend`: React voice agent frontend — session management, audio visualization, voice controls, and token-based auth against self-hosted LiveKit

### Modified Capabilities
- `deployment`: Add CORS configuration and token endpoint to deployment requirements

## Impact

- **New directory**: `frontend/` with React + Vite project (package.json, src/, etc.)
- **New dependency**: Node.js / npm ecosystem for frontend dev
- **Token server**: Needs access to `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` env vars
- **Networking**: Frontend connects to VPS LiveKit server at `LIVEKIT_URL` (from `.env.local`) in dev; token server runs locally alongside Vite dev server
- **No backend changes**: `agent.py` unchanged — frontend connects to the same LiveKit room and the agent auto-dispatches
