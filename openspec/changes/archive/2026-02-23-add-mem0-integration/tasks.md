## 1. Infrastructure & Dependencies

- [x] 1.1 Add `qdrant` service to `docker-compose.yml`
- [x] 1.2 Add `mem0ai` and `qdrant-client` to `pyproject.toml`

## 2. Configuration

- [x] 2.1 Initialize `AsyncMemoryClient` in `agent.py` with Qdrant and Gemini config

## 3. Integration

- [x] 3.1 Override `on_user_turn_completed` in `Assistant` class to asynchronously add user message to Mem0
- [x] 3.2 In `on_user_turn_completed`, asynchronously search Mem0 for context and inject it as an `assistant` message before calling `super().on_user_turn_completed()`
