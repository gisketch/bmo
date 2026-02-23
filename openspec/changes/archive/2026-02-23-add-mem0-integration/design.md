## Context

BMO currently has no persistent memory across sessions. We want to integrate Mem0 to provide this capability. The integration will be self-hosted on the VPS, using Qdrant as the vector store and Gemini for both LLM and Embeddings.

## Goals / Non-Goals

**Goals:**
- Integrate Mem0 into the LiveKit agent pipeline.
- Store user messages asynchronously to avoid blocking the conversation.
- Retrieve relevant context asynchronously and inject it into the LLM context before generating a reply.
- Use Qdrant as the vector store.
- Use Gemini for LLM and Embeddings.

**Non-Goals:**
- Building a custom UI for managing memories.
- Using local AI models (Ollama) for embeddings or LLM.

## Decisions

- **Architecture**: We will use the `mem0ai` Python library directly within `agent.py` rather than running a standalone Mem0 API service. This simplifies deployment and keeps all agent logic in one place.
- **Vector Store**: We will use Qdrant, deployed via `docker-compose.yml`, as it is lightweight and the default for Mem0.
- **Memory Injection**: We will intercept the `on_user_turn_completed` event in the LiveKit `Agent` class. We will fire-and-forget the `mem0_client.add()` call to store the user's message, and we will `await mem0_client.search()` to retrieve context before calling `super().on_user_turn_completed()`.
- **Concurrency**: Since `mem0ai` provides an `AsyncMemoryClient`, we will use it to ensure we don't block the LiveKit event loop during network calls to Qdrant or Gemini.

## Risks / Trade-offs

- **Latency**: Injecting context on every turn requires an API call to Gemini for embeddings and a search query to Qdrant. This will add ~200-500ms of latency to every turn.
  - *Mitigation*: We accept this latency for the benefit of automatic context injection. If it becomes an issue, we can switch to a tool-based memory approach later.
- **Event Loop Blocking**: If `mem0ai` has synchronous blocking code under the hood, it could disrupt the LiveKit audio stream.
  - *Mitigation*: We will use `AsyncMemoryClient` and monitor the agent's performance. If blocking occurs, we can wrap the calls in `asyncio.to_thread()`.
