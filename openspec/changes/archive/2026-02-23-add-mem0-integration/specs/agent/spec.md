## ADDED Requirements

### Requirement: Agent has persistent memory
The agent SHALL use Mem0 to store and retrieve user messages and context across sessions. The agent SHALL automatically inject relevant past context into the conversation before generating a reply.

#### Scenario: User message is stored
- **WHEN** the user completes a turn (speaks a message)
- **THEN** the agent asynchronously adds the message content to the Mem0 vector store.

#### Scenario: Relevant context is injected
- **WHEN** the user completes a turn
- **THEN** the agent asynchronously searches the Mem0 vector store for relevant memories and injects them as an `assistant` message into the chat context before the LLM generates its response.
