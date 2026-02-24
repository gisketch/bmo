## ADDED Requirements

### Requirement: Mem0 memory mode setting
The system SHALL support a configurable Mem0 behavior mode via `MEM0_SETTING`.

`MEM0_SETTING` SHALL support:
- `NORMAL`: store every user turn in Mem0 and run retrieval/injection on every user turn.
- `GATED`: only store curated durable memories and only run retrieval/injection on turns that need memory.

If `MEM0_SETTING` is unset or invalid, the system SHALL default to `GATED`.

#### Scenario: Default mode
- **WHEN** `MEM0_SETTING` is not set or is not one of the supported values
- **THEN** the system uses `GATED` behavior

#### Scenario: NORMAL mode behavior
- **WHEN** `MEM0_SETTING=NORMAL`
- **THEN** the system stores each completed user turn in Mem0 and attempts retrieval/injection for each completed user turn

#### Scenario: GATED mode behavior
- **WHEN** `MEM0_SETTING=GATED`
- **THEN** the system stores only curated durable memories and attempts retrieval/injection only on turns that meet retrieval triggers

### Requirement: Durable memory categorization
When storing curated durable memories, the system SHALL tag each memory with a category to support filtered retrieval.

Supported categories SHALL include:
- `relationships`
- `preferences`
- `goals`
- `personal_facts`

#### Scenario: Memory is stored with category
- **WHEN** the system stores a curated durable memory
- **THEN** it includes category metadata that matches one of the supported categories

### Requirement: Retrieval whitelist by category
In `GATED` mode, retrieval/injection SHALL whitelist durable categories so only durable memories are injected into the model context.

#### Scenario: Retrieval injects only durable categories
- **WHEN** retrieval/injection runs in `GATED` mode
- **THEN** injected memories are filtered to the supported durable categories