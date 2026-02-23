## Context

`agent.py` is a single 500-line file that contains every concern: configuration, external API clients (Fish Audio, DeepGram, Obsidian), status tracking, prompt loading/composition, the Assistant class with tools and Mem0 memory, server/entrypoint wiring, room lifecycle management, and the watchdog thread. All requirements from the `agent` spec remain unchanged — this is a pure structural refactor.

## Goals / Non-Goals

**Goals:**
- Split `agent.py` into focused, single-responsibility modules
- Keep `agent.py` as a slim ~30-line orchestrator (imports + server + main)
- Make each module independently readable and editable
- Preserve all existing behavior exactly

**Non-Goals:**
- Changing any runtime behavior, API surface, or external interfaces
- Adding new features or dependencies
- Restructuring the prompt JSON or deployment config

## Decisions

### Module layout: flat files over nested package

Use a flat `bmo/` package directory alongside `agent.py`, not deeply nested subpackages.

```
agent.py              ← slim entrypoint (~30 lines)
bmo/
  __init__.py
  config.py           ← constants, env, Mem0 client init
  status.py           ← LLM counter, Fish/DeepGram balance fetchers, build_status_response
  services.py         ← Obsidian RAG search
  prompt.py           ← load_prompt, compose_instructions
  assistant.py        ← Assistant class, tools, on_user_turn_completed
  room.py             ← ensure_room_and_dispatch, agent_watchdog
```

**Rationale:** Flat files are simpler to navigate and avoid import-depth complexity. Each file maps to one concern. A `bmo/` package groups them logically without cluttering the project root.

**Alternative considered:** Keeping everything in the project root as `config.py`, `status.py`, etc. Rejected because it would pollute the root alongside `Dockerfile`, `docker-compose.yml`, etc.

### agent.py stays as the entrypoint

`agent.py` remains the process entrypoint (referenced by Dockerfile CMD and livekit CLI). It imports from `bmo/` and wires server, prewarm, entrypoint, and `__main__`.

**Rationale:** Avoids changing Dockerfile, docker-compose, and deployment scripts.

### Mutable state stays in its owning module

- LLM counter state (`_llm_request_count`, `_llm_request_date`) stays in `status.py` with its `increment_llm_counter()` function
- DeepGram project ID cache stays in `status.py`
- Mem0 client instance stays in `config.py`

**Rationale:** Each module owns and encapsulates its state. Callers use functions, not raw globals.

## Risks / Trade-offs

- [Circular imports] → Mitigated by one-directional dependency flow: `config` ← `status`/`services`/`prompt` ← `assistant` ← `agent.py`/`room`
- [Import path changes break Dockerfile] → Mitigated by keeping `agent.py` as the entrypoint at the same path
- [Test imports may change] → Mitigated by updating `test.py` if it imports from `agent.py` directly
