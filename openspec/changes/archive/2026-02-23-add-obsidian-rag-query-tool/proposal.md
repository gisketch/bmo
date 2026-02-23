## Why

The agent sometimes needs accurate, user-specific facts from Ghegi’s Obsidian notes (e.g., IDs, account details, VPS credentials) and should be able to retrieve them instead of guessing.

## What Changes

- Add an LLM tool named `obsidian-query` that calls Ghegi’s Obsidian RAG search API with a free-text query.
- Return the service’s JSON results to the agent so it can cite relevant note snippets in responses.
- Keep the integration lightweight and safe for a real-time voice agent (short timeouts; no secret logging).

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `agent`: add a tool for querying Ghegi’s Obsidian RAG service for user-specific facts (IDs, credentials, personal/work notes).

## Impact

- Code: updates to `agent.py` (new `@function_tool` method + HTTP call).
- Runtime: agent process needs outbound HTTP access to `188.209.141.228:18000`.
- Configuration: may introduce an environment variable for the Obsidian service base URL (optional; can default to the provided endpoint).
