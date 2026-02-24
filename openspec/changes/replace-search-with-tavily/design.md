## Context

The current `search_internet` tool uses `duckduckgo-search`, an unofficial scraper that routes through Bing and triggers rate limits. Replacing with Tavily — a proper REST API designed for LLM agents.

## Goals / Non-Goals

**Goals:**
- Swap DuckDuckGo scraper for Tavily API with zero frontend changes.
- Expose `topic` (general/news/finance), `time_range`, `max_results`.
- Keep loading-status integration identical.

**Non-Goals:**
- Using Tavily's extract, crawl, map, or research endpoints.
- Using `include_answer` (BMO should speak its own words, not parrot Tavily's LLM answer).

## Decisions

**1. TavilyClient in a thread**

`TavilyClient.search()` is synchronous. Wrap in `asyncio.to_thread` just like the old DDGS approach. Alternative: use httpx directly against the REST API. Rejected — the SDK handles auth and response parsing.

**2. Result fields: title, url, content, score**

Tavily results include `title`, `url`, `content`, `score`, `raw_content`, `favicon`. Keep only the first four — minimal context for the LLM.

**3. Env var: `TAVILY_API_KEY`**

Read from environment at call time (not module-level init) so the agent can start even if the key is missing, and the tool returns a clear error.

## Risks / Trade-offs

- **[API cost]** → Tavily is free for 1,000 credits/month. Basic search = 1 credit. Acceptable for personal use.
- **[API key required]** → Unlike duckduckgo-search which needed no key. Mitigated by clear error message if key is missing.
