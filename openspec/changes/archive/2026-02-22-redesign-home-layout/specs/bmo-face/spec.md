## MODIFIED Requirements

### Requirement: Mobile-first layout
The Body component SHALL render as a full-screen background with the BMO teal color (#3FD4B6). Horizontal padding (`px-6`) and vertical gap (`gap-8`) SHALL be applied to all children uniformly. The face SHALL be positioned at the top of the viewport (no vertical centering).

#### Scenario: Full-screen background
- **WHEN** the app renders on any screen size
- **THEN** the entire viewport is filled with the BMO teal background color with content starting from the top

#### Scenario: Uniform padding
- **WHEN** the Body renders its children
- **THEN** all children share the same horizontal padding and vertical gap

### Requirement: BMO face component system
The frontend SHALL render a BMO-inspired animated character face composed of decoupled components: Body (full-screen background), Screen (face container with depth box), Face (eye/mouth coordinator), Eye (blinking dot), and Mouth (state-driven SVG shapes). The Screen component SHALL use a 16:10 aspect ratio instead of a fixed height.

#### Scenario: Component renders on load
- **WHEN** the app loads
- **THEN** the full-screen BMO background displays with the face container at the top showing two eyes and a mouth in the default Smile state

#### Scenario: Screen aspect ratio
- **WHEN** the Screen renders
- **THEN** the face container maintains a 16:10 aspect ratio regardless of viewport size

## ADDED Requirements

### Requirement: FirstRow component
The Body SHALL render a FirstRow below the Screen containing a cassette slot (depth-box inset) and an LED status indicator side by side.

### Requirement: SecondRow component
The Body SHALL render a SecondRow below the FirstRow containing two columns: left column (DPad + StartSelect, flushed left) and right column (TriangleButton + CircleButtons + mute toggle, flushed right).

### Requirement: BmoLayout wrapper
A BmoLayout component SHALL wrap the Body and its children, lifting agent visual state and connection state to compute LED status and mute control. It SHALL pass `ledState`, `glowIntensity`, `isMuted`, and `onToggleMute` props to child rows.
