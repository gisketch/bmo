# Frontend Domain Spec

## Overview
React + Vite SPA for voice interaction with the LiveKit agent. Uses `@livekit/components-react` for session management, audio visualization, and controls.

## Requirements

### Voice session connection
The frontend SHALL connect to the self-hosted LiveKit server and establish a voice session with the `voice-agent` agent using `TokenSource.endpoint()` and the `useSession` hook.

#### Scenario: Successful connection
- **WHEN** the user opens the frontend app and clicks connect
- **THEN** the app fetches a token from the local token server, connects to the LiveKit room, and the voice agent is dispatched to the session

#### Scenario: Disconnect
- **WHEN** the user clicks the disconnect button
- **THEN** the session ends, the room connection is closed, and the agent leaves

### Token endpoint
The frontend project SHALL include an Express token server implementing the LiveKit standard endpoint specification at `POST /getToken`. It MUST return `{ server_url, participant_token }` using the LiveKit Server SDK.

#### Scenario: Token generation
- **WHEN** the frontend sends a POST request to `/getToken` with `room_config` containing agent dispatch info
- **THEN** the server generates a JWT with `room_join` grant, includes `room_config` for agent dispatch, and returns the token with the LiveKit server URL

#### Scenario: CORS support
- **WHEN** the Vite dev server on a different port makes a cross-origin request to the token server
- **THEN** the token server responds with appropriate CORS headers allowing the request

### Audio visualization
_REMOVED — BarVisualizer and AgentAudioBar have been removed from the layout. Audio feedback is now provided through the LED status indicator's audio-reactive glow._

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
The frontend SHALL render two thin horizontal blue (`#1156A3`) buttons side by side with 3D extrusion and shadow, using the same press animation pattern as DPad.

### TriangleButton component
The frontend SHALL render a triangular SVG button in blue (`#3E9BF9`) with rounded corners, 3D extrusion (auto-darkened 30%), and press animation.

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

### useButtonPress hook
The frontend SHALL provide a reusable `useButtonPress` hook that tracks press state from mouse, touch, and keyboard events, returning `{ pressed, pressProps }`.

### useTrackVolume hook
The frontend SHALL provide a `useTrackVolume` hook that uses the Web Audio API AnalyserNode to compute real-time volume (0–1 normalized) from a LiveKit track reference or publication.

### Room audio rendering
The frontend SHALL use `RoomAudioRenderer` to play the agent's audio output through the user's speakers.

#### Scenario: Agent audio playback
- **WHEN** the agent publishes an audio track in the room
- **THEN** the user hears the agent's speech through their browser audio output
