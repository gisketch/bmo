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
The frontend SHALL render a BarVisualizer showing the agent's audio output, positioned at the bottom of the screen integrated into the BMO character layout. The visualizer SHALL be placed below the face area alongside microphone controls.

#### Scenario: Agent speaking
- **WHEN** the agent is speaking
- **THEN** the BarVisualizer displays animated audio bars from the agent's microphone track at the bottom of the BMO layout

#### Scenario: Agent listening
- **WHEN** the agent is in listening state
- **THEN** the visualizer reflects the listening state visually at the bottom of the screen

### Microphone controls
The frontend SHALL provide microphone toggle controls positioned at the bottom of the BMO layout so the user can mute/unmute their microphone during a voice session. The ControlBar SHALL be styled to fit the BMO design aesthetic.

#### Scenario: Mute microphone
- **WHEN** the user clicks the microphone button while unmuted
- **THEN** the user's audio track is muted and the agent stops receiving audio

#### Scenario: Unmute microphone
- **WHEN** the user clicks the microphone button while muted
- **THEN** the user's audio track is unmuted and the agent resumes receiving audio

### Room audio rendering
The frontend SHALL use `RoomAudioRenderer` to play the agent's audio output through the user's speakers.

#### Scenario: Agent audio playback
- **WHEN** the agent publishes an audio track in the room
- **THEN** the user hears the agent's speech through their browser audio output
