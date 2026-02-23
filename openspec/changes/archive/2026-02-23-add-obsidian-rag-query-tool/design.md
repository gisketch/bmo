## Context

The LiveKit voice agent defines LLM tools as `@function_tool()` methods on the `Assistant` class in `agent.py`. The agent already uses `httpx.AsyncClient` to call external APIs (Fish Audio, DeepGram).

We want the assistant to be able to fetch Ghegi-specific facts from an Obsidian RAG service during conversations, especially for details that should not be guessed (IDs, credentials).

## Goals / Non-Goals

**Goals:**
- Add a tool named `obsidian-query` that queries the Obsidian RAG search API with a free-text query.
- Keep latency reasonable for a real-time voice agent (short HTTP timeout).
- Return the service’s JSON response to the LLM as a JSON string, validating it has a top-level `results` array and ensuring each result includes `source_path`, `text`, and `score` keys.

**Non-Goals:**
- Building a local Obsidian indexer or changing the RAG service.
- Adding new frontend UI.
- Adding auth/encryption to the Obsidian service (assumed to be handled by the service/network).

## Decisions

- Use `httpx.AsyncClient` (already in use) for the Obsidian API call to avoid new dependencies.
- Use a Python method name `obsidian_query` but set the tool name to `obsidian-query` via `@function_tool(name=...)` to match the desired tool-call name.
- Default the endpoint to `http://188.209.141.228:18000/api/v1/search` and send the query via `params={"query": query}` to ensure proper URL encoding.
- On failures, return a small JSON payload with `results: []` and an `error` field so the LLM can recover without crashing the agent.

## Risks / Trade-offs

- [Sensitive content exposure] → Mitigation: do not log response bodies; keep error logs minimal.
- [Increased response latency] → Mitigation: short timeout and best-effort behavior (return empty results on failure).
- [Service unavailable] → Mitigation: tool returns an error payload; the assistant can ask the user to rephrase or provide the info.
