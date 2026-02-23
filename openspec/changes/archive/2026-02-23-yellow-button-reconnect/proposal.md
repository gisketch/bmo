## Why

When the phone goes idle and the BMO app is reopened, the LiveKit room connection drops. There is currently no way for the user to reconnect without fully reloading the app. The small green circle button (`#73F976`, 48px) has no handler and can serve as a reconnect trigger.

## What Changes

- Wire the small circle button in SecondRow to trigger a room reconnect via `session.start()`.
- The button only fires the reconnect when the connection state is `Disconnected`; it is a no-op otherwise.
- Pass the reconnect callback and disconnected flag from App → BmoLayout → SecondRow → CircleButton.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `frontend`: Add a reconnect requirement for the small circle button, covering the disconnected-reconnect scenario.

## Impact

- **Files touched**: `App.tsx`, `SecondRow.tsx`
- **No new dependencies** — uses existing `session.start()` and `useConnectionState`.
