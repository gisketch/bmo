## Why

The BMO face currently only reflects coarse LiveKit agent states, which makes the UI feel less reactive during key interactions (cassette events, button presses). Adding a small set of additional face states makes the character feel more “alive” without backend changes.

## What Changes

- Add transient face override states that can temporarily replace the base agent-driven face expression.
- Trigger a “cassette sending” style expression during cassette insert/eject animations.
- Add a developer-focused “TEST MODE” face override toggled by the Triangle button.
- While in TEST MODE, use DPad left/right to cycle through available face states.
- Keep the existing agent-state mapping (listening / thinking / speaking / offline) as the base layer.

## Capabilities

### New Capabilities

- *(none)*

### Modified Capabilities

- `bmo-face`: Add interaction-driven transient face overrides layered on top of the existing agent-state-to-visual-state mapping.

## Impact

- Frontend React state mapping in `frontend/src/App.tsx` (BmoLayout) will layer transient overrides over the base agent visual state.
- `frontend/src/types/bmo.ts` may expand the visual state constants/types to include explicit override states.
- No backend/API changes.
