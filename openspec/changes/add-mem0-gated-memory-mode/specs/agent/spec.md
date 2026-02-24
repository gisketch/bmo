## MODIFIED Requirements

### Requirement: Agent has persistent memory
The agent SHALL use Mem0 to store and retrieve durable user context across sessions.

The agent SHALL support `MEM0_SETTING` modes:
- `NORMAL`: current behavior (store each completed user turn; retrieve/inject context each turn).
- `GATED`: curated behavior (store only durable memories; retrieval/injection behavior unchanged).

#### Scenario: User message is stored (NORMAL)
- **WHEN** the user completes a turn and `MEM0_SETTING=NORMAL`
- **THEN** the agent asynchronously adds the user message content to the Mem0 vector store

#### Scenario: User message is stored (GATED)
- **WHEN** the user completes a turn and `MEM0_SETTING=GATED`
- **THEN** the agent asynchronously evaluates the turn with a memory gatekeeper and stores only canonicalized durable memories (not the full transcript) into Mem0 with category metadata
- **AND** if the gatekeeper determines the turn is transient or irrelevant, the agent SHALL NOT store anything into Mem0

#### Scenario: Relevant context is injected (NORMAL)
- **WHEN** the user completes a turn and `MEM0_SETTING=NORMAL`
- **THEN** the agent asynchronously searches the Mem0 vector store for relevant memories and injects them into the chat context before the LLM generates its response

#### Scenario: Relevant context is injected (GATED)
- **WHEN** the user completes a turn and `MEM0_SETTING=GATED`
- **THEN** the agent searches the Mem0 vector store for relevant memories and injects them into the chat context before the LLM generates its response
