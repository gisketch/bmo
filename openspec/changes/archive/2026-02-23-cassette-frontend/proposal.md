## Why

Cassette messages are already delivered from the agent to the frontend via the LiveKit data channel, but the UI currently only logs them to the console. This makes the feature effectively invisible to users.

The cassette slot is also currently interactive (press to eject/insert) which conflicts with the desired behavior: the slot should be empty by default and only show a cassette when a cassette message is received.

## What Changes

- Frontend stores the latest cassette payload received on topic `cassette`.
- Cassette slot defaults to empty (no cassette rendered).
- When a cassette message is received, a cassette is rendered in the slot and the sticker label text uses the message `title`.
- Pressing the cassette opens a placeholder modal that renders the message `content` text (visual design deferred).

## Capabilities

### Modified Capabilities
- `cassette-tool`: Frontend handling of received cassette messages now drives UI instead of console logging only.
- `frontend`: Cassette slot behavior changes from manual eject/insert to message-driven display.

## Impact

- `frontend/src/App.tsx` — replace console log handling with cassette state + modal open behavior
- `frontend/src/components/bmo/FirstRow.tsx` — render cassette conditionally and wire click handler
- `frontend/src/components/bmo/Cassette.tsx` — remove eject/insert interaction; render static cassette with label text from message title
- Add a small placeholder modal component for displaying cassette content

## Out of Scope

- Cassette history, persistence, or multiple cassette management
- Visual/animated cassette eject/insert interactions
- Final modal styling and layout
