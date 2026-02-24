# Frontend Domain Spec

## Purpose
React + Vite SPA for voice interaction with the LiveKit agent. Uses `@livekit/components-react` for session management, audio visualization, and controls.
## Requirements

### Voice session connection
The frontend SHALL connect to the self-hosted LiveKit server and establish a voice session using a pre-generated token via `TokenSource.literal()`. The frontend SHALL NOT dispatch an agent — the agent is already present in the fixed room.

#### Scenario: Successful connection
- **WHEN** the user opens the frontend app
- **THEN** the app uses the build-time token to connect to the fixed room `bmo-room`, where the agent is already present and ready

#### Scenario: Disconnect
- **WHEN** the user closes the browser tab or navigates away
- **THEN** the room connection is closed but the agent remains in the room for the next visit

### Audio visualization
The frontend SHALL NOT render BarVisualizer or AgentAudioBar in the layout. Audio feedback SHALL be provided through the LED status indicator's audio-reactive glow.

#### Scenario: No bar visualizer present
- **WHEN** the app renders the main layout
- **THEN** no bar-style audio visualization component is shown

### Microphone controls
The frontend SHALL provide a microphone mute/unmute toggle via the big red circle button (136px, `#900030`) in the SecondRow. When unmuted, the button SHALL display a microphone SVG icon in `#720026`. When muted, the button SHALL show no icon. The button uses `useLocalParticipant` to toggle `setMicrophoneEnabled`.

#### Scenario: Mute microphone
- **WHEN** the user clicks the big red circle while unmuted
- **THEN** the user's audio track is muted and the mic icon disappears

#### Scenario: Unmute microphone
- **WHEN** the user clicks the big red circle while muted
- **THEN** the user's audio track is unmuted and the mic icon appears

### DPad component
The frontend SHALL render a cross-shaped directional pad (DPad) with four arms in `#FFE249` yellow, a 3D extrusion layer in `#C4AA1A`, and a sharp shadow. The DPad SHALL animate on click/touch/keyboard press by translating down 5px toward the extrusion layer.

#### Scenario: DPad press
- **WHEN** the user clicks/touches the DPad or presses an arrow key
- **THEN** the main pad layer translates down 5px and the shadow fades out

### StartSelect buttons
The frontend SHALL render two thin horizontal blue (`#1156A3`) buttons side by side with 3D extrusion and shadow, using the same press animation pattern as DPad. The StartSelect component SHALL accept optional `onStartPress` and `onSelectPress` callback props that fire when the respective button's press animation completes (on mouse/touch up).

#### Scenario: Start button pressed
- **WHEN** the user clicks/touches the Start button (left button)
- **THEN** the button animates with the 3D press effect and the `onStartPress` callback fires on release

#### Scenario: Select button pressed
- **WHEN** the user clicks/touches the Select button (right button)
- **THEN** the button animates with the 3D press effect and the `onSelectPress` callback fires on release

### TriangleButton component
The frontend SHALL render a triangular SVG button in blue (`#3E9BF9`) with rounded corners, 3D extrusion (auto-darkened 30%), and press animation.

#### Scenario: Triangle button pressed
- **WHEN** the user presses the TriangleButton
- **THEN** it animates with the same press feedback pattern as other 3D buttons

### LED status indicator
The frontend SHALL render a circular LED indicator in the FirstRow that changes color based on connection/agent state: Offline (`#0E3A6B`), Connected (`#165BA9`), Talking (`#22C55E` with audio-reactive green glow). Glow intensity SHALL be proportional to agent audio volume.

#### Scenario: Agent talking
- **WHEN** the agent state is "speaking"
- **THEN** the LED turns green with a glow whose intensity matches the agent's audio output volume

#### Scenario: Disconnected
- **WHEN** the connection state is disconnected or reconnecting
- **THEN** the LED shows dark blue with no glow

### Cassette slot
The frontend SHALL render a cassette slot in the FirstRow as a wide element with a depth-box inset (outer `#0A3A2E`, inner `#0D4538` at 50% height). The cassette slot SHALL be interactive and allow press/release to eject or insert the cassette with a springy animation.

#### Scenario: Cassette slot renders
- **WHEN** the FirstRow renders
- **THEN** the cassette slot is visible with the specified depth-box inset styling

#### Scenario: Eject cassette
- **WHEN** the user presses and releases the cassette slot while the cassette is inserted
- **THEN** the cassette animates and ends fully ejected

#### Scenario: Insert cassette
- **WHEN** the user presses and releases the cassette slot while the cassette is ejected
- **THEN** the cassette animates and ends fully inserted

#### Scenario: Empty slot visual
- **WHEN** the cassette is fully ejected
- **THEN** the slot depth-box inset remains visible and no cassette elements remain visible within the slot

### useButtonPress hook
The frontend SHALL provide a reusable `useButtonPress` hook that tracks press state from mouse, touch, and keyboard events, returning `{ pressed, pressProps }`.

#### Scenario: Hook reports pressed state
- **WHEN** a user presses and releases a button via mouse, touch, or keyboard
- **THEN** `pressed` reflects the active press state and `pressProps` provides the necessary event handlers

### useTrackVolume hook
The frontend SHALL provide a `useTrackVolume` hook that uses the Web Audio API AnalyserNode to compute real-time volume (0–1 normalized) from a LiveKit track reference or publication.

#### Scenario: Volume normalized
- **WHEN** an audio track is provided to `useTrackVolume`
- **THEN** the hook outputs a volume value normalized to the range 0–1

### Room audio rendering
The frontend SHALL use `RoomAudioRenderer` to play the agent's audio output through the user's speakers.

#### Scenario: Agent audio playback
- **WHEN** the agent publishes an audio track in the room
- **THEN** the user hears the agent's speech through their browser audio output

### Screen conditional rendering
The Screen component SHALL accept an `activePage` prop (`'face' | 'status'`) and conditionally render either the Face component or the StatusPage component. When `activePage` is `'face'`, the Face with its eye and mouth state props SHALL render. When `activePage` is `'status'`, the StatusPage with status data props SHALL render.

#### Scenario: Face page active
- **WHEN** `activePage` is `'face'`
- **THEN** the Screen renders the Face component with eye blinking and mouth animations

#### Scenario: Status page active
- **WHEN** `activePage` is `'status'`
- **THEN** the Screen renders the StatusPage component with service health metrics

### Requirement: Screen CRT effect overlay
The frontend SHALL apply a CRT effect overlay to the BMO Screen area.

#### Scenario: Screen shows CRT styling
- **WHEN** the Screen component renders its active page (Face or StatusPage)
- **THEN** scanlines, vignette, and subtle flicker are visible over the screen content without blocking interaction

#### Scenario: Screen content has subtle warp
- **WHEN** the Screen component renders its active page (Face or StatusPage)
- **THEN** the rendered content subtly warps over time to mimic CRT geometry distortion

### Requirement: Layout consistency across pages
The frontend SHALL keep the Screen content layout consistent across the Face and Status pages within the same Screen container.

#### Scenario: Face to status transition
- **WHEN** `activePage` changes from `'face'` to `'status'`
- **THEN** the Screen container maintains consistent padding/overflow behavior and does not shift unexpectedly

### Requirement: Responsive screen content bounds
The frontend SHALL keep Face and Status content within the Screen bounds without clipping critical UI elements.

#### Scenario: Small viewport
- **WHEN** the viewport height is constrained
- **THEN** the Screen content remains visible within the Screen container and avoids overflow that hides critical content

### Requirement: Screen fills remaining height
The frontend SHALL size the Screen to fill the remaining vertical space above the control rows.

#### Scenario: Layout sizing
- **WHEN** the app layout renders
- **THEN** the Screen expands to fill remaining height and the control rows remain visible below

### Requirement: Disconnected screen off state
The frontend SHALL render a screen-off state when the agent is disconnected.

#### Scenario: Disconnected
- **WHEN** the agent is disconnected
- **THEN** the Screen content is hidden and the screen shows a dark fill with CRT overlay styling

### Requirement: Screen power transition
The frontend SHALL animate a CRT-style power transition when switching between screen-off and screen-on.

#### Scenario: Power on
- **WHEN** the screen transitions from off to on
- **THEN** the on screen expands vertically from the center before showing content

#### Scenario: Power off
- **WHEN** the screen transitions from on to off
- **THEN** the on screen collapses vertically to the center before hiding content

### Requirement: UI sound effects
The frontend SHALL preload UI sound effects and play them in response to user interactions.

#### Scenario: Button press SFX
- **WHEN** the user presses any interactive button
- **THEN** the frontend plays `button_1.wav`

#### Scenario: Body tap SFX
- **WHEN** the user taps on the BMO body background
- **THEN** the frontend randomly plays any `tap_body_*.wav`

#### Scenario: Screen tap SFX
- **WHEN** the user taps on the Screen area
- **THEN** the frontend randomly plays any `tap_glass_*.wav`

#### Scenario: TV power SFX
- **WHEN** the screen powers on or powers off
- **THEN** the frontend plays `tv_on.wav` or `tv_off.wav` respectively

#### Scenario: Cassette slot SFX
- **WHEN** the cassette begins ejecting
- **THEN** the frontend plays `cassette_out.wav`
- **WHEN** the cassette begins inserting
- **THEN** the frontend plays `cassette_in.wav`

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

### Requirement: Cassette content modal (placeholder)
When a cassette is visible in the cassette slot, pressing it SHALL open a modal overlay. The modal SHALL render the cassette message `content` text. The modal SHALL be dismissible via backdrop click or `Escape`.

#### Scenario: Dismiss modal
- **GIVEN** the cassette modal is open
- **WHEN** the user clicks the backdrop or presses `Escape`
- **THEN** the modal closes

### Requirement: Frontend receives loading status messages
The frontend SHALL listen for data-channel messages on topic `loading-status` from the LiveKit room. When a loading status message is received and the agent is in the `thinking` state, the frontend SHALL switch the screen to LoadingWithInfo mode, displaying the message text with the typewriter animation.

When the agent state changes away from `thinking` (e.g., the agent starts speaking or listening), the frontend SHALL clear the loading override and return to the standard agent-driven visual state.

#### Scenario: Loading status received while thinking
- **WHEN** the agent is in `thinking` state and a `loading-status` data-channel message arrives with text "Scanning digital brain for number thingies"
- **THEN** the screen switches from the thinking face to LoadingWithInfo displaying "Scanning digital brain for number thingies"

#### Scenario: Agent state changes after loading
- **GIVEN** the screen is showing LoadingWithInfo
- **WHEN** the agent state changes to `speaking`
- **THEN** the loading override is cleared and the screen returns to the agent-driven visual state (talking face)

#### Scenario: Loading status received while not thinking
- **WHEN** the agent is NOT in `thinking` state and a `loading-status` data-channel message arrives
- **THEN** the frontend still displays the LoadingWithInfo screen (the message was sent for a reason)

#### Scenario: Agent disconnects during loading
- **GIVEN** the screen is showing LoadingWithInfo
- **WHEN** the agent disconnects
- **THEN** the loading override is cleared and the screen shows the offline state

