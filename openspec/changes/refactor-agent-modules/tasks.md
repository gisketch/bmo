## 1. Create bmo package structure

- [x] 1.1 Create `bmo/__init__.py`

## 2. Extract modules

- [x] 2.1 Create `bmo/config.py` — constants, env, timezone, Mem0 client init
- [x] 2.2 Create `bmo/status.py` — LLM counter, Fish Audio/DeepGram balance fetchers, `build_status_response`
- [x] 2.3 Create `bmo/services.py` — `fetch_obsidian_search`
- [x] 2.4 Create `bmo/prompt.py` — `load_prompt`, `compose_instructions`
- [x] 2.5 Create `bmo/assistant.py` — `Assistant` class with tools and `on_user_turn_completed`
- [x] 2.6 Create `bmo/room.py` — `ensure_room_and_dispatch`, `agent_watchdog`

## 3. Rewrite entrypoint

- [x] 3.1 Rewrite `agent.py` as slim orchestrator importing from `bmo/`

## 4. Update deployment references

- [x] 4.1 Verify Dockerfile CMD still works with `agent.py` entrypoint
- [x] 4.2 Update `test.py` imports if needed
