## MODIFIED Requirements

### Cassette slot
The frontend SHALL render a cassette slot in the FirstRow as a wide element with a depth-box inset (outer `#0A3A2E`, inner `#0D4538` at 50% height). The cassette slot SHALL be interactive and allow the user to press and release to eject or insert the cassette with an animation.

#### Scenario: Cassette slot renders
- **WHEN** the FirstRow renders
- **THEN** the cassette slot is visible with the specified depth-box inset styling

#### Scenario: Eject cassette
- **WHEN** the user presses and releases the cassette slot while the cassette is inserted
- **THEN** the cassette animates and ends fully ejected

#### Scenario: Insert cassette
- **WHEN** the user presses and releases the cassette slot while the cassette is ejected
- **THEN** the cassette animates and ends fully inserted

#### Scenario: Empty slot visual
- **WHEN** the cassette is fully ejected
- **THEN** the cassette slot does not render the inner depth overlay layer (`#0D4538` at 50% height)

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

#### Scenario: Cassette slot SFX
- **WHEN** the cassette begins ejecting
- **THEN** the frontend plays `cassette_out.wav`
- **WHEN** the cassette begins inserting
- **THEN** the frontend plays `cassette_in.wav`
