## Context

BMO currently uses Mem0 in a “store everything, search every turn” pattern:
- Every completed user turn is stored into Mem0.
- Every completed user turn also triggers a Mem0 search, and any results are injected into the model context.

In practice, this produces two problems:
1. Long-term memory becomes polluted with transient or overly-personal content.
2. Voice latency increases due to an awaited Mem0 search on every turn.

This change introduces a mode setting (`MEM0_SETTING`) with a new default behavior that preserves the benefits of memory while keeping stored memories durable and retrieval targeted.

Constraints:
- The agent is voice-first; per-turn latency and event-loop blocking must be minimized.
- The project is single-user oriented today (`user_id="glenn"`).
- Mem0 is self-hosted OSS via `mem0ai` with Qdrant + Gemini config.

## Goals / Non-Goals

**Goals:**
- Provide `MEM0_SETTING` modes: `NORMAL` (current behavior) and `GATED` (new default).
- In `GATED` mode, store only curated durable memories (facts/preferences/goals/relationships) with explicit categories.
- Keep retrieval/injection behavior unchanged (Mem0 search + injection on every user turn).
- Keep memory storage asynchronous to avoid blocking the voice loop.

**Non-Goals:**
- Building a UI to inspect/edit memories.
- Implementing a full policy engine with complex NLP.
- Multi-user memory partitioning beyond the existing `user_id` approach.

## Decisions

### D1: Add `MEM0_SETTING` with `GATED` as default
We will add `MEM0_SETTING` (env var) parsed in `bmo/config.py`.
- Supported values: `NORMAL`, `GATED`.
- Default: `GATED` when unset/invalid.

Rationale:
- Allows quick rollback to current behavior.
- Keeps safe-by-default behavior for long-term storage.

Alternative considered:
- Separate code branches or feature flags per behavior. Rejected as it is harder to operate.

### D2: Gatekeeper runs before `mem0.add()` in `GATED` mode
We will introduce a gatekeeper function that takes the user’s message and returns a decision:
- store: boolean
- memories: list of canonical memory strings
- category: one of relationships/preferences/goals/personal_facts

Implementation approach: LLM-first gatekeeper.
- Use Gemini (via `GOOGLE_API_KEY`) to decide STORE/SKIP and output canonical, categorized memories.
- Provide the current user message and a small set of relevant existing Mem0 memories so the LLM can choose add vs update.
- If the key is missing or the LLM fails, fall back to heuristic extraction.

Rationale:
- Cost/latency-first: avoids adding an extra LLM call.
- Keeps Mem0 clean by not feeding raw transcripts into Mem0 inference.

Alternative considered:
- LLM gatekeeper that returns structured JSON per turn. Deferred; can be added later as an optional mode if heuristics miss important facts.

### D3: Store curated durable memories with metadata category
When storing in `GATED` mode, we store canonical memories (not raw transcripts) using Mem0 metadata:
- `metadata={"category": "relationships" | "preferences" | "goals" | "personal_facts", "mode": "gated"}`

Rationale:
- Enables deterministic retrieval filters.
- Keeps the memory store queryable and auditable.

### D4: Trigger-based retrieval/injection in `GATED` mode
We will keep retrieval/injection behavior unchanged across modes.

Rationale:
- This preserves existing behavior and avoids changing how the agent feels, while still ensuring the memory store stays clean.

### D5: Keep profile injection out of scope
We will not inject a special profile context at session start. Retrieval remains per-turn as before.

## Risks / Trade-offs

- LLM gatekeeper cost → Mitigation: run it asynchronously and keep the output small (1–3 items).
- LLM gatekeeper failures (rate limits, missing key) → Mitigation: fall back to heuristic extraction.
- Mis-categorization (wrong category) → Mitigation: keep category set small, use conservative patterns, and allow manual wipe by Mem0 delete filters if needed.
- Retrieval triggers too strict (memory not used when it should) → Mitigation: expand trigger list gradually; add metrics/logging for skipped retrieval decisions.
- Injecting as `system` message can over-constrain the model → Mitigation: inject with clear prefix (“Past memories (context only): …”) and consider switching injection role to `assistant` if needed.

## Migration Plan

1. Add `MEM0_SETTING` parsing with default `GATED`.
2. Implement LLM gatekeeper + category metadata storage.
3. Deploy with `MEM0_SETTING=GATED` and monitor logs for skipped/stored decisions.

Rollback:
- Set `MEM0_SETTING=NORMAL` to restore pre-change behavior.

## Open Questions

- Do we want an explicit user command to force-store (“remember this: …”) and force-forget (“forget that”) as tools?
- Should memory injection be `system` or `assistant` role for best prompting behavior?
- Should we add a lightweight local persistence of “profile injected” across reconnects, or keep it per-process/session only?