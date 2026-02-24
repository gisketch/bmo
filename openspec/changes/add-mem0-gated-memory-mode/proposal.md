## Why

BMO’s current Mem0 integration stores essentially every user utterance, which quickly pollutes long-term memory with transient or overly-personal details and makes retrieval/injection noisy. We need a way to only persist durable, useful facts and preferences while keeping voice latency low.

## What Changes

- Add a memory mode setting `MEM0_SETTING` with values:
  - `NORMAL`: current behavior (store every user turn; search/inject every turn)
  - `GATED`: curated memory behavior (new default)
- In `GATED` mode, add a memory “gatekeeper” step that decides whether to store anything from a turn and, if so, stores only canonicalized durable facts (not raw transcripts).
- Categorize stored memories (e.g., relationships, preferences, goals, personal_facts) via metadata to support precise retrieval.
- Keep retrieval/injection behavior unchanged (Mem0 is searched and injected on each user turn), while ensuring the memory store itself stays clean.

## Capabilities

### New Capabilities

- `mem0-memory-mode`: Configure Mem0 behavior via `MEM0_SETTING` (`NORMAL` vs `GATED`) with `GATED` as the default.

### Modified Capabilities

- `agent`: Modify the persistent memory requirement so long-term memory storage is curated (gatekeeper + categories) while leaving retrieval/injection behavior unchanged.

## Impact

- Code:
  - `bmo/config.py`: new `MEM0_SETTING` configuration and defaults.
  - `bmo/assistant.py`: implement gated store via an LLM gatekeeper while preserving the existing retrieval/injection behavior.
  - Potentially a small helper module (e.g., `bmo/memory_policy.py`) for gatekeeper decisions and categorization.
- Runtime behavior:
  - Reduced Mem0 storage volume and cleaner memories.
  - Retrieval behavior remains the same; the main improvement is higher quality long-term memories.
- Documentation:
  - Update `GUIDE.md` and/or env docs to describe `MEM0_SETTING` and its modes.