## Context

The LiveKit session is created in `App` via `useSession(tokenSource)` and started with `session.start()`. Inside `BmoLayout` (wrapped by `SessionProvider`), `useConnectionState()` tracks the state. The small green circle button (`CircleButton size=48 color=#73F976`) in `SecondRow` currently has no handler.

## Goals / Non-Goals

**Goals:**
- Let users reconnect to the room after an idle disconnect by pressing the small circle button.
- Button is a no-op when already connected—prevents double-connect.

**Non-Goals:**
- Auto-reconnect logic (out of scope).
- Changing the button's appearance based on connection state (future consideration).

## Decisions

1. **Reconnect via `session.end()` + `session.start()`** — force teardown before reconnect. Just calling `session.start()` is a no-op when the session thinks it's already connected (even if the room is dead). Alternative: `session.start()` alone—rejected because the session/room can get out of sync after idle.

2. **Dual-condition guard: session AND room** — check both `connectionState === Connected` (from `useConnectionState()`) and `room.state === Connected` (from `useRoomContext()`). Only when both agree they're connected is the button a no-op. This handles the case where the session reports connected but the room WebSocket is dead.

3. **Prop-drill from App → BmoLayout → SecondRow** — `App` passes `onReconnect` and `onForceDisconnect` callbacks. `BmoLayout` assembles the green button handler with the 5-tap logic. SecondRow receives `onReconnectPress`.

4. **5-tap force disconnect** — for testing, tapping the green button 5 times within 2 seconds while fully connected calls `session.end()`. Useful for simulating the idle-disconnect scenario without waiting.

## Risks / Trade-offs

- [Token expiry] If the pre-generated token expires while disconnected, `session.start()` will fail. → Mitigation: none needed now; token refresh is a separate concern.
- [Double-tap] User could tap rapidly while connecting. → Mitigation: reconnect only fires when not fully connected; `session.end()` + `session.start()` is safe to call repeatedly.
