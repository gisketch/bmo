## MODIFIED Requirements

### Requirement: Frontend receives loading status messages
The frontend SHALL listen for data-channel messages on topic `loading-status` from the LiveKit room. When a loading status message is received and the agent is in the `thinking` state, the frontend SHALL switch the screen to LoadingWithInfo mode, displaying the message text with the typewriter animation.

When the agent state changes away from `thinking` (e.g., the agent starts speaking or listening), the frontend SHALL clear the loading override and return to the standard agent-driven visual state.

#### Scenario: Loading status received while thinking
- **WHEN** the agent is in `thinking` state and a `loading-status` data-channel message arrives with text "Scanning digital brain for number thingies"
- **THEN** the screen switches from the thinking face to LoadingWithInfo displaying "Scanning digital brain for number thingies"

#### Scenario: Agent state changes after loading
- **GIVEN** the screen is showing LoadingWithInfo
- **WHEN** the agent state changes to `speaking`
- **THEN** the loading override is cleared and the screen returns to the agent-driven visual state (talking face)

#### Scenario: Loading status received while not thinking
- **WHEN** the agent is NOT in `thinking` state and a `loading-status` data-channel message arrives
- **THEN** the frontend still displays the LoadingWithInfo screen (the message was sent for a reason)

#### Scenario: Agent disconnects during loading
- **GIVEN** the screen is showing LoadingWithInfo
- **WHEN** the agent disconnects
- **THEN** the loading override is cleared and the screen shows the offline state
