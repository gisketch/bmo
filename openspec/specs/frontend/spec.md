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
The frontend SHALL render a cassette slot in the FirstRow as a wide element with a depth-box inset (outer `#0A3A2E`, inner `#0D4538` at 50% height).

#### Scenario: Cassette slot renders
- **WHEN** the FirstRow renders
- **THEN** the cassette slot is visible with the specified depth-box inset styling

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

