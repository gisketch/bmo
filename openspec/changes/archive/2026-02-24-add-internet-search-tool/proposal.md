## Why

BMO currently has no way to search the internet. The only external knowledge tool is `obsidian-query` which searches Ghegi's personal notes. Adding a DuckDuckGo-powered search tool gives BMO real-time access to web results, news, and videos, making it useful for general-knowledge questions, current events, and research.

## What Changes

- Add a new `search_internet` function tool to `Assistant` using the `duckduckgo-search` Python library (DDGS class).
- Expose multiple search modes: **text**, **news**, and **videos** via a `mode` parameter.
- Each invocation sends a `loading-status` message to the frontend (same pattern as `obsidian-query`), with a BMO-style `loading_message` parameter.
- Add `duckduckgo-search` to project dependencies.
- Add prompt rules and tool description to `bmo.json` so the LLM knows when/how to use the tool.

## Capabilities

### New Capabilities
- `internet-search`: DuckDuckGo-powered internet search tool with text, news, and video search modes, plus frontend loading status integration.

### Modified Capabilities

_(none — no existing spec behavior changes)_

## Impact

- **Code**: `bmo/assistant.py` (new tool method), `bmo/services.py` (new service function).
- **Dependencies**: `pyproject.toml` adds `duckduckgo-search`.
- **Config**: `prompts/bmo.json` gains tool rules and description for `search_internet`.
- **Frontend**: No frontend changes — reuses existing `loading-status` topic.
