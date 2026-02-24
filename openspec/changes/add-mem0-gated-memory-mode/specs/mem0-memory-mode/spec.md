## ADDED Requirements

### Requirement: Mem0 memory mode setting
The system SHALL support a configurable Mem0 behavior mode via `MEM0_SETTING`.

`MEM0_SETTING` SHALL support:
- `NORMAL`: store every user turn in Mem0.
- `GATED`: only store curated durable memories.

If `MEM0_SETTING` is unset or invalid, the system SHALL default to `GATED`.

#### Scenario: Default mode
- **WHEN** `MEM0_SETTING` is not set or is not one of the supported values
- **THEN** the system uses `GATED` behavior

#### Scenario: NORMAL mode behavior
- **WHEN** `MEM0_SETTING=NORMAL`
- **THEN** the system stores each completed user turn in Mem0

#### Scenario: GATED mode behavior
- **WHEN** `MEM0_SETTING=GATED`
- **THEN** the system stores only curated durable memories

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
In `GATED` mode, stored memories SHALL be categorized to support future filtered retrieval.

#### Scenario: Retrieval injects only durable categories
- **WHEN** the system stores curated durable memories
- **THEN** those stored memories can be retrieved later using category metadata filters

### Requirement: Backfill legacy uncategorized memories
The system SHALL provide a developer-run backfill script that converts legacy uncategorized memories into categorized canonical memories using the same memory gatekeeper logic.

#### Scenario: Legacy memories are migrated
- **WHEN** a developer runs the backfill script for a user
- **THEN** the script adds categorized canonical memories for durable facts/preferences/goals/relationships
- **AND** the script deletes the original legacy memory only after at least one durable replacement memory is successfully added