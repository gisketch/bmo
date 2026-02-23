## 1. Plumbing

- [x] 1.1 In `App.tsx`, create a `handleReconnect` callback that calls `session.start()` and pass it plus `isDisconnected` to `BmoLayout`
- [x] 1.2 In `SecondRow`, accept `onReconnectPress` prop and wire it to the small green CircleButton's `onClick`

## 2. Guard logic

- [x] 2.1 Gate the reconnect callback so it only fires when `connectionState === ConnectionState.Disconnected`
