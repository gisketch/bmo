## Why

The `duckduckgo-search` library is an unofficial scraper that routes through Bing, triggers rate limits, and returns noisy debug logs. Tavily is a proper search API designed for LLM agents — reliable, fast, returns clean results with relevance scores, and supports `general`/`news`/`finance` topics plus time ranges.

## What Changes

- Remove `duckduckgo-search` dependency, add `tavily-python`.
- Rewrite the search service function in `bmo/services.py` to use `TavilyClient`.
- Update `search_internet` tool parameters: replace `mode` with `topic` (general/news/finance), keep `time_range`, `max_results`, `loading_message`.
- Add `TAVILY_API_KEY` env var requirement.
- Update prompt rules and tool description in `bmo.json`.

## Capabilities

### New Capabilities
_(none)_

### Modified Capabilities
- `internet-search`: Replacing DuckDuckGo scraper backend with Tavily API. Tool parameters change (`mode` → `topic`, `timelimit` → `time_range`).

## Impact

- **Code**: `bmo/services.py` (rewrite search function), `bmo/assistant.py` (update tool params).
- **Dependencies**: `pyproject.toml` swaps `duckduckgo-search` → `tavily-python`.
- **Config**: `prompts/bmo.json` updated tool rules. `.env.local` needs `TAVILY_API_KEY`.
- **Frontend**: No changes.
