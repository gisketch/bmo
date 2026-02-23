# bmo-cassette-animation Specification

## Purpose
Define the user interaction, animation behavior, and sound effects for the BMO cassette slot.
## Requirements
### Requirement: Cassette Slot Animation
The system SHALL animate the cassette slot when pressed and released, simulating insertion or ejection.

#### Scenario: Press and release to eject
- **WHEN** the user presses and releases the cassette slot while the cassette is inserted
- **THEN** the cassette animates with a springy motion and ends fully ejected.

#### Scenario: Press and release to insert
- **WHEN** the user presses and releases the cassette slot while the cassette is ejected
- **THEN** the cassette animates with a springy motion and ends fully inserted.

#### Scenario: Cassette SFX
- **WHEN** the cassette begins ejecting
- **THEN** the system plays `cassette_out.wav`
- **WHEN** the cassette begins inserting
- **THEN** the system plays `cassette_in.wav`

