## Why

BMO's physical buttons (Start/Select) are decorative — they have no function. Users have no visibility into the health of the AI pipeline (TTS balance, STT balance, LLM quota) or whether the agent is actually connected. Adding a status page toggled by the Start button turns dead UI into a diagnostic dashboard, giving real-time system insight without leaving the BMO interface.

## What Changes

- **Status page view**: A new screen content mode that replaces the Face with a monospaced text panel showing service health metrics.
- **Page toggle system**: Pressing the Start button cycles between `Face` (default) and `Status` page modes. The Screen component conditionally renders either Face or StatusPage.
- **Backend status API endpoint**: A new API route on the agent that fetches Fish Audio credit balance, DeepGram project balance, and reports agent connectivity state. Google Gemini has no quota API, so LLM status will show a self-tracked request counter.
- **Frontend status data hook**: A React hook that fetches status data from the backend API and exposes it to the StatusPage component.
- **Geist Mono font**: Added as an npm dependency for the monospaced status display.
- **Start/Select button callbacks**: StartSelect component accepts `onStartPress` / `onSelectPress` callbacks so parent components can respond to presses.

## Capabilities

### New Capabilities
- `bmo-status`: Status page UI component, page toggle system, status data hook, backend status API, and service balance fetching logic.

### Modified Capabilities
- `frontend`: StartSelect buttons gain press callbacks; Screen component gains conditional rendering for page modes.
- `agent`: Agent exposes a status data channel or HTTP endpoint for service health metrics.

## Impact

- **Frontend**: New component (`StatusPage`), new hook (`useStatusData`), modified `StartSelect`, `Screen`, `App.tsx`, new font dependency (`geist`).
- **Backend**: New data-fetching logic in `agent.py` using `httpx` or `aiohttp` for Fish Audio and DeepGram REST APIs. New dependency: `httpx`.
- **Dependencies**: `geist` (npm), `httpx` (pip).
