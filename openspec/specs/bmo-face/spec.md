# BMO Face Domain Spec

## Overview
BMO-inspired animated character face for the voice agent frontend. Composed of decoupled components with state-driven animations mapping LiveKit agent states to visual expressions.

## Requirements

### BMO face component system
The frontend SHALL render a BMO-inspired animated character face composed of decoupled components: Body (full-screen background), Screen (face container with depth box), Face (eye/mouth coordinator), Eye (blinking dot), and Mouth (state-driven SVG shapes). Each component SHALL be in its own file under `src/components/bmo/`.

#### Scenario: Component renders on load
- **WHEN** the app loads
- **THEN** the full-screen BMO background displays with the face container showing two eyes and a mouth in the default Smile state

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
The Body component SHALL render as a full-screen background (no mobile device frame) with the BMO teal color (#3FD4B6). The face area SHALL be centered vertically with controls at the bottom. The layout SHALL be mobile-first, filling 100vh/100vw.

#### Scenario: Full-screen background
- **WHEN** the app renders on any screen size
- **THEN** the entire viewport is filled with the BMO teal background color, no device frame borders

#### Scenario: Controls at bottom
- **WHEN** the app renders
- **THEN** the microphone controls and audio visualizer are positioned at the bottom of the screen below the face
