## Why

`agent.py` is ~500 lines containing configuration, API clients, status tracking, Obsidian RAG, prompt composition, the Assistant class, server setup, room management, and the watchdog — all in one file. This makes it hard to navigate, edit, and reason about for both humans and AI. Splitting into focused modules improves readability and maintainability without changing any behavior.

## What Changes

- Extract configuration constants and client initialization into a `config` module
- Extract status-tracking functions (LLM counter, Fish Audio balance, DeepGram balance) into a `status` module
- Extract Obsidian RAG search into a `services` module
- Extract prompt loading and composition into a `prompt` module
- Extract the `Assistant` class (with tools and memory injection) into an `assistant` module
- Extract room lifecycle management (ensure_room_and_dispatch, watchdog) into a `room` module
- Slim `agent.py` down to ~30 lines: imports, server creation, prewarm, entrypoint wiring, and `__main__`

## Capabilities

### New Capabilities

_None — this is a pure refactor with no new behavior._

### Modified Capabilities

- `agent`: Implementation restructured into multiple Python modules; all requirements and interfaces remain unchanged.

## Impact

- `agent.py` — rewritten to a slim orchestrator that imports from submodules
- New directory `agent/` (or similar module structure) with focused files
- No behavioral changes, no API changes, no dependency changes
- Existing tests and deployment (Dockerfile, docker-compose) may need minor import path updates
