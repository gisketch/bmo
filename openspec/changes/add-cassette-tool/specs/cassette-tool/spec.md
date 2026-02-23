## ADDED Requirements

### Requirement: Present to cassette tool
The assistant SHALL expose a function tool named `present_to_cassette` that accepts a `title` (1-2 word label) and `content` (the information to present). When invoked, it SHALL publish a JSON payload `{ "type": "cassette", "title": "<title>", "content": "<content>" }` to the LiveKit room data channel on topic `cassette` using reliable delivery.

The tool SHALL return a confirmation string to the LLM so it can acknowledge the cassette send in its spoken response.

#### Scenario: LLM presents an ID number
- **WHEN** the LLM calls `present_to_cassette` with title "Philhealth ID" and content "1234-5678-9012"
- **THEN** the agent publishes `{ "type": "cassette", "title": "Philhealth ID", "content": "1234-5678-9012" }` on topic `cassette` and returns a success confirmation to the LLM

#### Scenario: Room is unavailable
- **WHEN** the LLM calls `present_to_cassette` but the room reference is not available
- **THEN** the tool returns an error string to the LLM indicating the cassette could not be sent

### Requirement: Frontend receives cassette messages
The frontend SHALL listen for data-channel messages on topic `cassette` from the LiveKit room. When a cassette message is received, it SHALL parse the JSON payload and log it to the browser console as `CASSETTE MESSAGE RECEIVED: <payload>`.

#### Scenario: Cassette message arrives
- **WHEN** the agent publishes a cassette data-channel message
- **THEN** the frontend logs `CASSETTE MESSAGE RECEIVED:` followed by the parsed JSON object to the console

### Requirement: Prompt instructs cassette tool usage
The system prompt SHALL include a rule instructing BMO to use `present_to_cassette` whenever presenting precise data (IDs, numbers, credentials, codes) to the user. BMO SHALL mention in its spoken response that the information was also sent through the cassette.

#### Scenario: BMO retrieves an ID
- **WHEN** BMO retrieves a specific ID or credential via obsidian-query
- **THEN** BMO speaks the information AND calls `present_to_cassette` with it, mentioning it was sent through the cassette
