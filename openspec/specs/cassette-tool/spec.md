# cassette-tool Specification

## Purpose
Defines the `present_to_cassette` agent tool and the frontend data-channel listener that receives cassette messages, allowing BMO to push physical text (IDs, credentials, codes) to the user's screen. Also defines the `obsidian-query` tool's data-channel integration for loading status messages.
## Requirements
### Requirement: Present to cassette tool
The assistant SHALL expose a function tool named `present_to_cassette` that accepts a `title` (1-2 word label) and `content` (the information to present). When invoked, it SHALL publish a JSON payload `{ "type": "cassette", "title": "<title>", "content": "<content>" }` to the LiveKit room data channel on topic `cassette` using reliable delivery.

The tool SHALL return a confirmation string to the LLM so it can acknowledge the cassette send in its spoken response.

The assistant SHALL also expose a function tool named `obsidian-query` that accepts a `query: str` parameter and a `loading_message: str` parameter. Before executing the search, it SHALL publish a loading status message `{ "type": "loading-status", "text": "<loading_message>" }` on topic `loading-status`. Then it SHALL call the Obsidian RAG service with the query and return the JSON results.

#### Scenario: LLM presents an ID number
- **WHEN** the LLM calls `present_to_cassette` with title "Philhealth ID" and content "1234-5678-9012"
- **THEN** the agent publishes `{ "type": "cassette", "title": "Philhealth ID", "content": "1234-5678-9012" }` on topic `cassette` and returns a success confirmation to the LLM

#### Scenario: Room is unavailable
- **WHEN** the LLM calls `present_to_cassette` but the room reference is not available
- **THEN** the tool returns an error string to the LLM indicating the cassette could not be sent

#### Scenario: Obsidian query sends loading status before search
- **WHEN** the LLM calls `obsidian-query` with query "VPS credentials" and loading_message "Digging through memory files for server secrets"
- **THEN** the agent publishes the loading status on topic `loading-status` and then executes the obsidian search

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

### Requirement: Prompt instructs cassette tool usage
The system prompt SHALL include a rule instructing BMO to use `present_to_cassette` whenever presenting precise data (IDs, numbers, credentials, codes) to the user. BMO SHALL mention in its spoken response that the information was also sent through the cassette.

The system prompt SHALL also include a rule instructing BMO to always provide a creative, BMO-style `loading_message` when calling `obsidian-query`, describing what BMO is searching for in a playful way.

#### Scenario: BMO retrieves an ID
- **WHEN** BMO retrieves a specific ID or credential via obsidian-query
- **THEN** BMO speaks the information AND calls `present_to_cassette` with it, mentioning it was sent through the cassette

#### Scenario: BMO calls obsidian-query with loading message
- **WHEN** BMO calls `obsidian-query`
- **THEN** BMO provides a loading_message like "Scanning my digital brain for your number thingies"

