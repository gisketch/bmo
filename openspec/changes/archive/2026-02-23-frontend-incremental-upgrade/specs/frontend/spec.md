## ADDED Requirements

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
