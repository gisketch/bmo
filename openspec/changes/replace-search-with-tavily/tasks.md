## 1. Dependencies

- [x] 1.1 Replace `duckduckgo-search` with `tavily-python` in `pyproject.toml`

## 2. Service Layer

- [x] 2.1 Remove all DuckDuckGo code from `bmo/services.py` and add `search_tavily` function using TavilyClient

## 3. Tool + Prompt Update

- [x] 3.1 Update `search_internet` tool in `bmo/assistant.py` — change params (`mode`→`topic`, `timelimit`→`time_range`), update import, keep loading-status
- [x] 3.2 Update `prompts/bmo.json` tool rules and description for new params
