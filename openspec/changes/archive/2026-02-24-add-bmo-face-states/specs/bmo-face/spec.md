## ADDED Requirements

### Requirement: Interaction-driven face overrides
The frontend SHALL support face override states that can temporarily replace the base agent-driven face expression during key UI interactions, and it SHALL support a developer-oriented test override mode for hard-selecting face states.

#### Scenario: Cassette insert/eject overrides face
- **WHEN** a cassette insert or eject animation is active
- **THEN** the face shows a distinct “cassette interaction” expression until the animation completes

#### Scenario: Cassette insert triggers shake
- **WHEN** a cassette insert animation begins
- **THEN** the face triggers the transient shake animation for ~300ms

#### Scenario: Agent thinking shows thinking pose
- **WHEN** the agent state is "thinking" and the face is not in test override mode
- **THEN** the mouth is a straight line slightly tilted down to the right
- **AND THEN** the left eye is positioned slightly higher than the right eye
- **AND THEN** the face slowly floats upward while the thinking state is active

#### Scenario: Entering thinking plays hmm SFX
- **WHEN** the agent state transitions into "thinking" and the face is not in test override mode
- **THEN** the system plays a random `hmm_*.wav` sound effect once on entry

#### Scenario: LoadingWithInfo state renders centered loading text
- **WHEN** the LoadingWithInfo face-replacement state is used
- **THEN** it renders centered pixel-font text (default "Loading") with extra horizontal padding
- **AND THEN** the text enters with a quick typewriter effect
- **AND THEN** it shows looping trailing dots (1→2→3→repeat)

#### Scenario: Test mode can switch to LoadingWithInfo
- **WHEN** test override mode is enabled and the user cycles to the LoadingWithInfo preset
- **THEN** the face content area renders LoadingWithInfo instead of the normal face components

#### Scenario: Triangle toggles face override test mode
- **WHEN** the user presses the Triangle button
- **THEN** the face enters or exits a test override mode where agent-state mapping no longer changes the face

#### Scenario: DPad cycles face states in test mode
- **WHEN** test override mode is enabled and the user presses DPad left or right
- **THEN** the face switches to the previous or next available face state preset

#### Scenario: Shake preset animates on entry
- **WHEN** test override mode switches into the "Shake" face state preset
- **THEN** the eyes are closed (squished chevron style), the mouth is OpenSmile, and the face shakes for ~300ms on entry

#### Scenario: Glass taps can trigger transient shake
- **WHEN** the user taps on the glass while not in test override mode
- **THEN** the system MAY trigger a transient shake override with approximately 30% probability
- **AND THEN** for the duration of the transient shake (~300ms), the eyes are closed (squished chevron style), the mouth is OpenSmile, and the face shakes
- **AND THEN** after the transient shake ends, the face returns to the agent-driven face state

#### Scenario: Shake triggers chuckle SFX
- **WHEN** a shake animation starts
- **THEN** the system plays a random BMO chuckle sound effect

#### Scenario: Button press triggers BeepBoop pulse
- **WHEN** the user presses any BMO button control (mouse, touch, or keyboard)
- **THEN** the system MAY play a random BMO beep/boop sound effect with approximately 30% probability
- **AND THEN** when the beep/boop sound plays, the face briefly shows MouthOh with squished chevron eyes for ~120ms
