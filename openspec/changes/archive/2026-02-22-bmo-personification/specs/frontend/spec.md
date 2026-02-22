## MODIFIED Requirements

### Requirement: Audio visualization
The frontend SHALL render a BarVisualizer showing the agent's audio output, positioned at the bottom of the screen integrated into the BMO character layout. The visualizer SHALL be placed below the face area alongside microphone controls.

#### Scenario: Agent speaking
- **WHEN** the agent is speaking
- **THEN** the BarVisualizer displays animated audio bars from the agent's microphone track at the bottom of the BMO layout

#### Scenario: Agent listening
- **WHEN** the agent is in listening state
- **THEN** the visualizer reflects the listening state visually at the bottom of the screen

### Requirement: Microphone controls
The frontend SHALL provide microphone toggle controls positioned at the bottom of the BMO layout so the user can mute/unmute their microphone during a voice session. The ControlBar SHALL be styled to fit the BMO design aesthetic.

#### Scenario: Mute microphone
- **WHEN** the user clicks the microphone button while unmuted
- **THEN** the user's audio track is muted and the agent stops receiving audio

#### Scenario: Unmute microphone
- **WHEN** the user clicks the microphone button while muted
- **THEN** the user's audio track is unmuted and the agent resumes receiving audio
