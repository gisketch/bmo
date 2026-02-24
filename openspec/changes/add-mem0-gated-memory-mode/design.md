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
- In `GATED` mode, only retrieve/inject memories when the user’s message indicates memory is useful (trigger-based retrieval), rather than on every turn.
- Keep memory storage asynchronous to avoid blocking the voice loop.
- Keep retrieval lightweight (filters/top_k/threshold) and avoid retrieval when not needed.

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

Implementation approach (phase 1): heuristics-first gatekeeper.
- Regex/keyword patterns extract durable facts (e.g., “my brother is X” → “Has a brother named X”).
- If no durable pattern matches, we skip storing entirely.

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
We will avoid `mem0.search()` on every turn in `GATED` mode.
Instead, we run retrieval/injection only when a message matches retrieval triggers such as:
- Explicit memory prompts: “remember…”, “do you remember…”, “what do you know about me?”
- Preference/relationship questions: “what do I like…”, “who is my brother…”, “my preferences…”, etc.

When retrieval runs, we filter to durable categories and keep results small:
- `filters={"AND": [{"metadata": {"category": {"in": [..durable..]}}}]}` where supported
- `top_k` small (e.g., 5–10)
- optional similarity threshold (if supported by the OSS client)

Rationale:
- Saves latency/cost on turns where memory is irrelevant (small talk, tool requests like “random cassette”).

Alternative considered:
- Retrieve every N turns. Rejected as it still injects noise/cost on irrelevant turns.

### D5: Session-start “profile” injection implemented as first-turn injection
The LiveKit Agent callback we reliably control today is `on_user_turn_completed(turn_ctx, new_message)`.
We will inject a compact profile only once per session by:
- Tracking a boolean `self._mem0_profile_injected`.
- On the first completed user turn in `GATED` mode, run a single Mem0 search with a generic “profile” query (e.g., “user preferences relationships goals personal facts”), filtered to durable categories, and inject the results.

Rationale:
- Avoids relying on framework-specific hooks that may not exist in this codebase.
- Uses the existing `turn_ctx` injection pattern already working today.

## Risks / Trade-offs

- Heuristics miss some durable facts → Mitigation: add explicit “remember this” trigger and/or optional LLM gatekeeper later.
- Mis-categorization (wrong category) → Mitigation: keep category set small, use conservative patterns, and allow manual wipe by Mem0 delete filters if needed.
- Retrieval triggers too strict (memory not used when it should) → Mitigation: expand trigger list gradually; add metrics/logging for skipped retrieval decisions.
- Injecting as `system` message can over-constrain the model → Mitigation: inject with clear prefix (“Past memories (context only): …”) and consider switching injection role to `assistant` if needed.

## Migration Plan

1. Add `MEM0_SETTING` parsing with default `GATED`.
2. Implement gatekeeper + category metadata storage.
3. Implement trigger-based retrieval + one-time profile injection.
4. Deploy with `MEM0_SETTING=GATED` and monitor logs for skipped/stored decisions.

Rollback:
- Set `MEM0_SETTING=NORMAL` to restore pre-change behavior.

## Open Questions

- Do we want an explicit user command to force-store (“remember this: …”) and force-forget (“forget that”) as tools?
- Should memory injection be `system` or `assistant` role for best prompting behavior?
- Should we add a lightweight local persistence of “profile injected” across reconnects, or keep it per-process/session only?