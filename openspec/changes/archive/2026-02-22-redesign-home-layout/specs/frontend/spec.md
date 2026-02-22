## ADDED Requirements

### Requirement: DPad component
The frontend SHALL render a cross-shaped directional pad (DPad) with four arms in `#FFE249` yellow, a 3D extrusion layer in `#C4AA1A`, and a sharp shadow. The DPad SHALL animate on click/touch/keyboard press by translating down 5px toward the extrusion layer.

#### Scenario: DPad press
- **WHEN** the user clicks/touches the DPad or presses an arrow key
- **THEN** the main pad layer translates down 5px and the shadow fades out

### Requirement: StartSelect buttons
The frontend SHALL render two thin horizontal blue (`#1156A3`) buttons side by side with 3D extrusion and shadow, using the same press animation pattern as DPad.

### Requirement: TriangleButton component
The frontend SHALL render a triangular SVG button in blue (`#3E9BF9`) with rounded corners, 3D extrusion (auto-darkened 30%), and press animation.

### Requirement: LED status indicator
The frontend SHALL render a circular LED indicator in the FirstRow that changes color based on connection/agent state: Offline (`#0E3A6B`), Connected (`#165BA9`), Talking (`#22C55E` with audio-reactive green glow). Glow intensity SHALL be proportional to agent audio volume.

#### Scenario: Agent talking
- **WHEN** the agent state is "speaking"
- **THEN** the LED turns green with a glow whose intensity matches the agent's audio output volume

#### Scenario: Disconnected
- **WHEN** the connection state is disconnected or reconnecting
- **THEN** the LED shows dark blue with no glow

### Requirement: Cassette slot
The frontend SHALL render a cassette slot in the FirstRow as a wide element with a depth-box inset (outer `#0A3A2E`, inner `#0D4538` at 50% height).

### Requirement: useButtonPress hook
The frontend SHALL provide a reusable `useButtonPress` hook that tracks press state from mouse, touch, and keyboard events, returning `{ pressed, pressProps }`.

### Requirement: useTrackVolume hook
The frontend SHALL provide a `useTrackVolume` hook that uses the Web Audio API AnalyserNode to compute real-time volume (0–1 normalized) from a LiveKit track reference or publication.

## MODIFIED Requirements

### Requirement: Microphone controls
The frontend SHALL provide a microphone mute/unmute toggle via the big red circle button (136px, `#900030`) in the SecondRow. When unmuted, the button SHALL display a microphone SVG icon in `#720026`. When muted, the button SHALL show no icon. The button uses `useLocalParticipant` to toggle `setMicrophoneEnabled`.

#### Scenario: Mute microphone
- **WHEN** the user clicks the big red circle while unmuted
- **THEN** the user's audio track is muted and the mic icon disappears

#### Scenario: Unmute microphone
- **WHEN** the user clicks the big red circle while muted
- **THEN** the user's audio track is unmuted and the mic icon appears

## REMOVED Requirements

### Requirement: Bottom controls bar
The ControlBar and AgentAudioBar components are removed from the layout. The BarVisualizer is no longer rendered. Microphone control is handled by the big red circle button instead.
