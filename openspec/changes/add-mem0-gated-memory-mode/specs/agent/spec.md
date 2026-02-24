## MODIFIED Requirements

### Requirement: Agent has persistent memory
The agent SHALL use Mem0 to store and retrieve durable user context across sessions.

The agent SHALL support `MEM0_SETTING` modes:
- `NORMAL`: current behavior (store each completed user turn; retrieve/inject context each turn).
- `GATED`: curated behavior (store only durable memories; retrieve/inject only when needed).

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
- **THEN** the agent runs retrieval/injection only when the user’s message indicates memory is useful (e.g., identity/relationship/preference questions, “remember…”, “do you remember…”, “what do you know about me?”)
- **AND** the agent filters retrieved memories to durable categories (relationships/preferences/goals/personal_facts) before injecting them

#### Scenario: Session-start profile injection (GATED)
- **WHEN** a session starts and `MEM0_SETTING=GATED`
- **THEN** the agent performs a best-effort retrieval of durable memories and injects a compact “profile” context into the chat context once for the session