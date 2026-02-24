## Context

BMO has tool-calling capabilities via LiveKit's `function_tool` decorator. The existing `obsidian-query` tool demonstrates the pattern: publish a `loading-status` data message to the room, call an async service function, return JSON results. The new internet search tool follows this same architecture.

The `duckduckgo-search` library provides a synchronous `DDGS` class with `text()`, `news()`, and `videos()` methods. Since the agent runs in an async context, searches will be dispatched via `asyncio.to_thread`.

## Goals / Non-Goals

**Goals:**
- Give BMO real-time internet search via DuckDuckGo (text, news, videos).
- Reuse the loading-status frontend integration pattern.
- Expose enough parameters for the LLM to make useful searches (mode, max_results, timelimit).
- Keep results compact so they fit within LLM context windows.

**Non-Goals:**
- Image search (results are URLs, not useful for voice agent).
- Proxy/Tor configuration.
- Caching or rate-limit management beyond what duckduckgo-search handles internally.
- Any frontend UI changes.

## Decisions

**1. Single tool with `mode` parameter vs. separate tools per search type**

Use a single `search_internet` tool with a `mode` parameter (`text`, `news`, `videos`). This keeps the tool surface small and lets the LLM pick the right mode. The alternative (3 separate tools) clutters the tool list and adds prompt overhead.

**2. Service function in `bmo/services.py`**

Place the DuckDuckGo call logic in `bmo/services.py` alongside `fetch_obsidian_search`. The service function accepts `query`, `mode`, `max_results`, and `timelimit`, runs the synchronous DDGS call in a thread, and returns a JSON string. This keeps the assistant method thin (loading status + delegation).

**3. Result trimming**

Cap returned results to meaningful fields only (title, url/href, body/description, date for news). Full DDGS responses include image tokens, embed HTML, etc. that waste context. The service function normalizes output to a consistent `{"results": [...]}` shape.

**4. Default `max_results=5`**

Voice agents have limited context. Default to 5 results, let the LLM request up to 10.

## Risks / Trade-offs

- **[Rate limiting]** → DuckDuckGo may rate-limit heavy usage. Mitigation: low default `max_results`, no retry logic (fail fast, inform user).
- **[Sync library in async agent]** → `asyncio.to_thread` wrapping adds minor overhead. Acceptable since search latency dominates.
- **[Result freshness]** → DuckDuckGo results may lag vs. Google. Acceptable for a personal assistant.
