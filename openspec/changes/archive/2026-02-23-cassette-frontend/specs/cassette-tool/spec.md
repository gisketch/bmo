## MODIFIED Requirements

### Requirement: Frontend receives cassette messages
The frontend SHALL listen for data-channel messages on topic `cassette` from the LiveKit room. When a cassette message is received, it SHALL parse the JSON payload and update UI state so a cassette becomes visible in the cassette slot using the payload `title` as the cassette label.

When the user presses the visible cassette, the frontend SHALL open a placeholder modal that renders the payload `content` text.

#### Scenario: Cassette message arrives
- **WHEN** the agent publishes a cassette data-channel message
- **THEN** the frontend shows a cassette in the slot labeled with the payload `title` and plays the cassette insert animation + SFX

#### Scenario: Cassette message replaces existing cassette
- **GIVEN** the frontend already has a visible cassette
- **WHEN** the agent publishes another cassette data-channel message
- **THEN** the frontend ejects the current cassette out of view, swaps the payload, and inserts the new cassette back into view

#### Scenario: User opens cassette
- **GIVEN** a cassette message has been received and a cassette is visible
- **WHEN** the user presses the cassette
- **THEN** the frontend opens a modal that renders the payload `content`
