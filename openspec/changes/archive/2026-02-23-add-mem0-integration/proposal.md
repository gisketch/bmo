## Why

We want to give BMO persistent memory so it can remember facts, preferences, and context across different sessions. This will make interactions with BMO feel more continuous and personalized. We will use Mem0 to achieve this, running entirely self-hosted on our VPS using Qdrant as the vector store and Gemini for embeddings and LLM tasks.

## What Changes

- Add Qdrant to `docker-compose.yml` as the local vector store.
- Add `mem0ai` and `qdrant-client` dependencies to `pyproject.toml`.
- Configure Mem0 in `agent.py` to use Gemini for LLM and Embeddings, and Qdrant for Vector Store.
- Modify `agent.py` to asynchronously add user messages to Mem0.
- Modify `agent.py` to asynchronously search Mem0 for relevant context and inject it as an `assistant` message before the LLM generates a reply.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `agent`: The voice agent will now have persistent memory capabilities, automatically injecting relevant past context into the conversation.

## Impact

- **Infrastructure**: Requires running a new Qdrant container via Docker Compose.
- **Dependencies**: Adds `mem0ai` and `qdrant-client` to the Python environment.
- **Code**: `agent.py` will be updated to handle asynchronous memory extraction and retrieval during the LiveKit conversation loop.
