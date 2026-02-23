## MODIFIED Requirements

### Cassette slot
The frontend SHALL render a cassette slot in the FirstRow as a wide element with a depth-box inset (outer `#0A3A2E`, inner `#0D4538` at 50% height). The cassette slot SHALL NOT be user-interactive for eject/insert behavior.

#### Scenario: Default empty slot
- **WHEN** the FirstRow renders and no cassette message has been received
- **THEN** the slot inset is visible and no cassette is rendered

#### Scenario: Show cassette on message
- **WHEN** a cassette message is received
- **THEN** a cassette is rendered in the slot and its label uses the payload `title`
- **AND** the cassette insert animation and cassette insert SFX are played

#### Scenario: Replace existing cassette on message
- **GIVEN** a cassette is already visible
- **WHEN** another cassette message is received
- **THEN** the current cassette is ejected out of view
- **AND** the cassette label/content are updated while offscreen
- **AND** the new cassette is inserted back into view

## ADDED Requirements

### Requirement: Cassette content modal (placeholder)
When a cassette is visible in the cassette slot, pressing it SHALL open a modal overlay. The modal SHALL render the cassette message `content` text. The modal SHALL be dismissible via backdrop click or `Escape`.

#### Scenario: Dismiss modal
- **GIVEN** the cassette modal is open
- **WHEN** the user clicks the backdrop or presses `Escape`
- **THEN** the modal closes
