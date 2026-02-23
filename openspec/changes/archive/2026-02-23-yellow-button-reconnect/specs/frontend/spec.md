## ADDED Requirements

### Requirement: Reconnect via small circle button
The frontend SHALL allow the user to reconnect to the LiveKit room by pressing the small green circle button (`#73F976`, 48px) in SecondRow. The button SHALL trigger a reconnect only when the session and room are not both in `Connected` state. The reconnect SHALL tear down the existing session via `session.end()` before calling `session.start()`. When both session and room are fully connected, the button SHALL be a no-op on single press.

#### Scenario: Reconnect after idle disconnect
- **WHEN** either the session connection state or the room state is not `Connected` and the user presses the small circle button
- **THEN** the app calls `session.end()` followed by `session.start()` to rejoin the room

#### Scenario: Button ignored while fully connected
- **WHEN** both the session connection state and room state are `Connected` and the user presses the small circle button once
- **THEN** nothing happens

### Requirement: Force disconnect via 5-tap on small circle button
The frontend SHALL allow the user to force disconnect from the LiveKit room by tapping the small green circle button 5 times rapidly (within a 2-second window) while fully connected. This is intended for testing the disconnected state.

#### Scenario: 5-tap force disconnect
- **WHEN** both session and room are fully connected and the user taps the small circle button 5 times within 2 seconds
- **THEN** the app calls `session.end()` to disconnect from the room
