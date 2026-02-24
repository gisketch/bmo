## Why

BMO’s current Mem0 integration stores essentially every user utterance, which quickly pollutes long-term memory with transient or overly-personal details and makes retrieval/injection noisy. We need a way to only persist durable, useful facts and preferences while keeping voice latency low.

## What Changes

- Add a memory mode setting `MEM0_SETTING` with values:
  - `NORMAL`: current behavior (store every user turn; search/inject every turn)
  - `GATED`: curated memory behavior (new default)
- In `GATED` mode, add a memory “gatekeeper” step that decides whether to store anything from a turn and, if so, stores only canonicalized durable facts (not raw transcripts).
- Categorize stored memories (e.g., relationships, preferences, goals, personal_facts) via metadata to support precise retrieval.
- Add a retrieval gate so Mem0 search/injection runs only when the user’s turn looks like it needs memory (e.g., identity/relationship/preference questions, “remember…”, “do you remember…”) instead of on every turn.
- Inject a small “profile” context once at session start (best-effort) to preserve the feeling of continuity without per-turn Mem0 search.

## Capabilities

### New Capabilities

- `mem0-memory-mode`: Configure Mem0 behavior via `MEM0_SETTING` (`NORMAL` vs `GATED`) with `GATED` as the default.

### Modified Capabilities

- `agent`: Modify the persistent memory requirement so long-term memory storage is curated (gatekeeper + categories) and retrieval/injection is gated rather than executed on every turn.

## Impact

- Code:
  - `bmo/config.py`: new `MEM0_SETTING` configuration and defaults.
  - `bmo/assistant.py`: implement gated store + gated retrieval + session-start profile injection.
  - Potentially a small helper module (e.g., `bmo/memory_policy.py`) for gatekeeper decisions and categorization.
- Runtime behavior:
  - Reduced Mem0 storage volume and cleaner memories.
  - Reduced per-turn latency by avoiding Mem0 search on turns that don’t need it.
- Documentation:
  - Update `GUIDE.md` and/or env docs to describe `MEM0_SETTING` and its modes.