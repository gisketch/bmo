## 1. Configuration

- [x] 1.1 Add `MEM0_SETTING` parsing in `bmo/config.py` with supported values `NORMAL|GATED` and default `GATED`
- [x] 1.2 Ensure the effective `MEM0_SETTING` is logged at startup for visibility

## 2. Gatekeeper + Categorized Storage

- [x] 2.1 Create `bmo/memory_policy.py` gatekeeper that extracts canonical durable memories and assigns one of: relationships/preferences/goals/personal_facts
- [x] 2.2 Update `bmo/assistant.py` to use the gatekeeper in `GATED` mode and store only canonical memories (skip storing if none)
- [x] 2.3 Store category metadata on saved memories to support filtered retrieval
- [x] 2.4 Preserve `NORMAL` mode behavior (store raw user turn as before)
- [x] 2.5 Expand gatekeeper patterns for relationships/favorites (e.g., "I have a brother named X")
- [x] 2.6 Add `bmo/llm_gatekeeper.py` Gemini-based gatekeeper using `GOOGLE_API_KEY` with structured JSON output
- [x] 2.7 Wire `GATED` mode to use LLM gatekeeper (with heuristic fallback)

## 3. Trigger-Based Retrieval + Profile Injection

- [x] 3.1 Implement retrieval triggers (keywords/patterns) to decide whether to call Mem0 search in `GATED` mode
- [x] 3.2 Add one-time per-session “profile” injection in `GATED` mode (best-effort) using durable-category filtered search
- [x] 3.3 Filter retrieved results by durable categories in `GATED` mode before injecting into chat context
- [x] 3.4 Preserve `NORMAL` mode behavior (search/inject every turn as before)
- [x] 3.5 Backward-compatible durable injection for uncategorized legacy memories
- [x] 3.6 Revert retrieval/injection to original behavior (search and inject every turn) while keeping gated storage

## 4. Documentation

- [x] 4.1 Update `GUIDE.md` (or equivalent) to document `MEM0_SETTING`, modes, and default behavior

## 5. Backfill

- [x] 5.1 Add a developer-run script to backfill legacy uncategorized memories into categorized canonical ones

## 6. Verification

- [x] 6.1 Run targeted verification to ensure the agent imports/starts cleanly and gated mode does not block the event loop