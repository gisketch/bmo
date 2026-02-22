## Context

The BMO voice agent currently uses a **per-session dispatch model**: each page load creates a random room, fetches a JWT from an Express token server (port 3001), connects to LiveKit, and dispatches the agent. The agent cold-starts its full pipeline (Silero VAD, Groq STT, Gemini LLM, Fish Audio TTS) on every dispatch, taking 5-10 seconds. The token server also occupies an extra port on the VPS.

This is a single-user personal project — there's only ever one human user at a time.

## Goals / Non-Goals

**Goals:**
- Agent stays connected to a fixed room permanently — zero cold-start on user visit
- User gets an instant greeting on every tab open (pipeline already warm)
- Eliminate the Express token server and its port
- Simplify deployment (fewer services, fewer moving parts)

**Non-Goals:**
- Multi-user / multi-room support
- Dynamic room creation
- Token refresh / rotation infrastructure (build-time regeneration is sufficient)

## Decisions

### D1: Fixed room with infinite lifetime

Use a single fixed room `bmo-room` created via the LiveKit API with `empty_timeout=0` and `departure_timeout=0`. This prevents the room from auto-closing when participants leave.

**Alternative considered**: Keep random room names but pre-warm the agent — rejected because the agent would still need dispatch per session, and we'd need a mechanism to route to the pre-warmed instance.

### D2: Agent persistence via `close_on_disconnect=False` + participant wait loop

Keep using `livekit-agents` framework and `AgentSession` (preserves the full STT→LLM→TTS pipeline orchestration). Key changes:

1. Set `room_options=room_io.RoomOptions(close_on_disconnect=False)` so the agent session survives user disconnect.
2. After initial `session.start()`, enter a loop: `await ctx.wait_for_participant()` → `session.generate_reply()` (greet) → wait again when participant leaves.
3. Wrap the entire entrypoint in a reconnect/watchdog loop that re-dispatches the agent if the room or connection drops.

The agent process starts up and dispatches itself to `bmo-room` via the LiveKit API, then stays alive indefinitely.

**Alternative considered**: Raw `livekit` RTC SDK for manual room connection — rejected because it would require re-implementing the entire voice pipeline orchestration that `AgentSession` provides.

### D3: Self-dispatch at startup

Add a startup function to `agent.py` that:
1. Creates the room `bmo-room` via `api.LiveKitAPI().room.create_room()` with persistence flags
2. Creates an agent dispatch via `api.LiveKitAPI().agent_dispatch.create_dispatch()`
3. This triggers the agent's own `@rtc_session` entrypoint

This way the agent is self-contained — no external setup scripts needed to create the room or dispatch.

### D4: Build-time token generation

Generate a JWT at frontend build time using a Node.js script that:
1. Reads `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` from environment
2. Creates a token with `roomJoin: true`, `room: "bmo-room"`, identity `bmo-user`, 30-day TTL
3. Outputs it as `VITE_LIVEKIT_TOKEN` environment variable for Vite

The frontend uses `TokenSource.literal()` with the pre-baked token. No `RoomConfiguration` needed since the agent is already in the room.

**Alternative considered**: Keep `server.js` for dynamic tokens — rejected because it's an extra service/port for a single-user project where a static token suffices.

### D5: Static file serving in production

Replace the Express-based `web` Docker service with a lightweight static file server. Use `npx serve` (already available in the Node ecosystem) or an nginx container. No server-side logic needed.

The Dockerfile becomes a single-stage build: Vite build → serve static files.

### D6: Token generation script for Docker build

Add a `scripts/generate-token.js` script that can be run:
- At Docker build time (baked into the frontend)
- Manually during development
- As part of the monthly token refresh

The docker-compose `web` service will run this script as part of the build, passing LiveKit credentials as build args.

## Risks / Trade-offs

- **[Room disappears on LiveKit restart]** → Agent's watchdog loop detects disconnect, re-creates room and re-dispatches. Docker `restart: unless-stopped` handles process-level crashes.
- **[Token expires after 30 days]** → Requires rebuild/redeploy monthly. Acceptable for a personal project. Could add a cron job or CI pipeline to automate.
- **[Only one user at a time]** → By design. If a second browser connects, both share the same agent. The `bmo-user` identity means a second tab will disconnect the first (LiveKit deduplicates by identity). Could generate random identity client-side but this is fine for single-user.
- **[API secrets in build args]** → Only present during Docker build, not in the final image. The JWT itself doesn't expose secrets.
- **[`close_on_disconnect` + wait loop is not a blessed pattern]** → Pragmatic for a personal project. The watchdog loop handles edge cases.

## Migration Plan

1. Update `agent.py` with persistent connection logic
2. Create `scripts/generate-token.js` for build-time token generation
3. Update `frontend/src/App.tsx` to use `TokenSource.literal()`
4. Remove `frontend/server.js`
5. Update `frontend/Dockerfile` for static serving
6. Update `docker-compose.yml` with new build args and simplified web service
7. Rebuild and deploy — LiveKit server does NOT need changes
