## 1. Dependencies

- [x] 1.1 Add `duckduckgo-search` to `pyproject.toml` dependencies

## 2. Service Layer

- [x] 2.1 Add `search_duckduckgo` async function to `bmo/services.py` that wraps DDGS calls (text/news/videos), normalizes results, and returns JSON

## 3. Tool Registration

- [x] 3.1 Add `search_internet` function tool to `Assistant` in `bmo/assistant.py` with `query`, `mode`, `max_results`, `timelimit`, and `loading_message` parameters
- [x] 3.2 Wire loading-status data message publishing (same pattern as `obsidian-query`)

## 4. Prompt Configuration

- [x] 4.1 Add `search_internet` tool rules to `prompts/bmo.json` `tools.rules`
- [x] 4.2 Add `search_internet` tool description to `prompts/bmo.json` `tools.descriptions`

## 5. Validation

- [x] 5.1 Run the agent and verify `search_internet` tool is registered without import errors
