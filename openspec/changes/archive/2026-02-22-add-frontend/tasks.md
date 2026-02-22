## 1. Project Setup

- [x] 1.1 Scaffold React + Vite project in `frontend/` with TypeScript template
- [x] 1.2 Install LiveKit packages: `@livekit/components-react`, `@livekit/components-styles`, `livekit-client`
- [x] 1.3 Install token server dependencies: `express`, `livekit-server-sdk`, `cors`, `dotenv`

## 2. Token Server

- [x] 2.1 Create `frontend/server.js` implementing `POST /getToken` per LiveKit endpoint spec (returns `{ server_url, participant_token }`)
- [x] 2.2 Configure CORS to allow requests from Vite dev server origin
- [x] 2.3 Load `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` from `../.env.local`

## 3. Frontend App

- [x] 3.1 Create `App.tsx` with `TokenSource.endpoint()`, `useSession`, and `SessionProvider`
- [x] 3.2 Add `BarVisualizer` for agent audio visualization with agent state display
- [x] 3.3 Add `ControlBar` with microphone toggle and disconnect controls
- [x] 3.4 Add `RoomAudioRenderer` for agent audio playback
- [x] 3.5 Add minimal CSS/layout for the voice agent UI

## 4. Integration & Dev Scripts

- [x] 4.1 Add npm scripts: `dev` (Vite), `server` (token server), `dev:all` (both concurrently)
- [x] 4.2 Add `frontend/.env` with `VITE_TOKEN_SERVER_URL` pointing to local token server
- [x] 4.3 Test: frontend connects to VPS LiveKit, agent dispatches, voice conversation works
