# BMO Face Domain Spec

## Purpose
BMO-inspired animated character face for the voice agent frontend. Composed of decoupled components with state-driven animations mapping LiveKit agent states to visual expressions.
## Requirements

### BMO face component system
The frontend SHALL render a BMO-inspired animated character face composed of decoupled components: Body (full-screen background), Screen (face container with depth box), Face (eye/mouth coordinator), Eye (blinking dot), and Mouth (state-driven SVG shapes). The Screen component SHALL use a 16:10 aspect ratio instead of a fixed height. Each component SHALL be in its own file under `src/components/bmo/`.

#### Scenario: Component renders on load
- **WHEN** the app loads
- **THEN** the full-screen BMO background displays with the face container at the top showing two eyes and a mouth in the default Smile state

#### Scenario: Screen aspect ratio
- **WHEN** the Screen renders
- **THEN** the face container maintains a 16:10 aspect ratio regardless of viewport size

### Mouth state system
The Mouth component SHALL support the following static states: Smile (0), Sad (1), OpenSmile (2), MouthOh (4), OpenSad (5). It SHALL also support animated talking states: TalkHappy (3) and TalkSad (6). Talking states SHALL cycle through 3 frames at 150ms intervals, never repeating the same frame consecutively.

#### Scenario: Static smile mouth
- **WHEN** the mouth state is Smile (0)
- **THEN** the mouth renders a simple curved upward SVG path

#### Scenario: Static sad mouth
- **WHEN** the mouth state is Sad (1)
- **THEN** the mouth renders a simple curved downward SVG path

#### Scenario: Open smile mouth
- **WHEN** the mouth state is OpenSmile (2)
- **THEN** the mouth renders an open mouth SVG with teeth and tongue in a smile shape

#### Scenario: Mouth oh
- **WHEN** the mouth state is MouthOh (4)
- **THEN** the mouth renders a tall elliptical "O" shape with teeth and tongue

#### Scenario: Open sad mouth
- **WHEN** the mouth state is OpenSad (5)
- **THEN** the mouth renders an open inverted frown SVG with teeth and tongue

#### Scenario: Talk happy animation
- **WHEN** the mouth state is TalkHappy (3)
- **THEN** the mouth cycles between OpenSmile, closed wide smile, and MouthOh frames at 150ms intervals with no consecutive identical frames

#### Scenario: Talk sad animation
- **WHEN** the mouth state is TalkSad (6)
- **THEN** the mouth cycles between OpenSad, closed wide sad, and MouthOh frames at 150ms intervals with no consecutive identical frames

### Eye blink system
The Eye component SHALL render as a round dot that squishes vertically (scaleY 0.1) to simulate blinking. The Face component SHALL schedule random blinks every 1-3 seconds. The eye state architecture SHALL be extensible — an `EyeState` type SHALL exist even though only "normal" is implemented now.

#### Scenario: Random blinking
- **WHEN** the face is visible
- **THEN** both eyes blink simultaneously at random intervals between 1-3 seconds, each blink lasting 100ms

#### Scenario: Eye state extensibility
- **WHEN** a developer adds a new eye state to the EyeState type
- **THEN** the Eye component can be extended to handle the new state without restructuring

### Agent-state-to-visual-state mapping
The app SHALL map LiveKit agent states to BMO visual states: agent listening → Listening (normal eyes, Smile mouth), agent speaking → Talking (normal eyes, TalkHappy mouth), agent thinking → Thinking (normal eyes, MouthOh mouth), agent disconnected/offline → Offline (normal eyes, Sad mouth).

#### Scenario: Agent is listening
- **WHEN** the LiveKit agent state is "listening"
- **THEN** the BMO face shows normal blinking eyes and Smile mouth

#### Scenario: Agent is speaking
- **WHEN** the LiveKit agent state is "speaking"
- **THEN** the BMO face shows normal blinking eyes and TalkHappy animated mouth

#### Scenario: Agent is thinking
- **WHEN** the LiveKit agent state is "thinking"
- **THEN** the BMO face shows normal blinking eyes and MouthOh mouth

#### Scenario: Agent is disconnected
- **WHEN** the LiveKit connection state is disconnected
- **THEN** the BMO face shows normal blinking eyes and Sad mouth

### Mobile-first layout
The Body component SHALL render as a full-screen background with the BMO teal color (#3FD4B6). Horizontal padding (`px-6`) and vertical gap (`gap-8`) SHALL be applied to all children uniformly. The face SHALL be positioned at the top of the viewport (no vertical centering).

#### Scenario: Full-screen background
- **WHEN** the app renders on any screen size
- **THEN** the entire viewport is filled with the BMO teal background color with content starting from the top

#### Scenario: Uniform padding
- **WHEN** the Body renders its children
- **THEN** all children share the same horizontal padding and vertical gap

### FirstRow component
The Body SHALL render a FirstRow below the Screen containing a cassette slot (depth-box inset) and an LED status indicator side by side.

#### Scenario: FirstRow renders below screen
- **WHEN** the Body renders
- **THEN** the FirstRow renders below the Screen and contains both a cassette slot and an LED indicator

### SecondRow component
The Body SHALL render a SecondRow below the FirstRow containing two columns: left column (DPad + StartSelect, flushed left) and right column (TriangleButton + CircleButtons + mute toggle, flushed right).

#### Scenario: SecondRow renders two columns
- **WHEN** the Body renders
- **THEN** the SecondRow renders below the FirstRow with a left column (DPad + StartSelect) and a right column (Triangle + circles + mute)

### BmoLayout wrapper
A BmoLayout component SHALL wrap the Body and its children, lifting agent visual state and connection state to compute LED status and mute control. It SHALL pass `ledState`, `glowIntensity`, `isMuted`, and `onToggleMute` props to child rows.

#### Scenario: BmoLayout provides shared state
- **WHEN** the app renders the BMO layout
- **THEN** the layout computes LED and mute state and passes the required props to the child rows

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

