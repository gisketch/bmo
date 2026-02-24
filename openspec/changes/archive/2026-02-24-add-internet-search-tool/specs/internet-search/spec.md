## ADDED Requirements

### Requirement: Internet search tool registration
The system SHALL register a `search_internet` function tool on the `Assistant` class, decorated with `@function_tool`, exposing it to the LLM for invocation.

#### Scenario: Tool is available to agent
- **WHEN** the Assistant is initialized
- **THEN** `search_internet` is listed among its callable function tools

### Requirement: Search modes
The `search_internet` tool SHALL accept a `mode` parameter with values `text`, `news`, or `videos`. The mode determines which DuckDuckGo search endpoint is used.

#### Scenario: Text search
- **WHEN** `mode` is `text`
- **THEN** the tool calls `DDGS.text()` and returns web page results with title, href, and body fields

#### Scenario: News search
- **WHEN** `mode` is `news`
- **THEN** the tool calls `DDGS.news()` and returns news article results with date, title, body, url, and source fields

#### Scenario: Video search
- **WHEN** `mode` is `videos`
- **THEN** the tool calls `DDGS.videos()` and returns video results with title, description, content (URL), publisher, and duration fields

#### Scenario: Invalid mode
- **WHEN** `mode` is not one of the valid values
- **THEN** the tool defaults to `text` mode

### Requirement: Query parameter
The tool SHALL accept a `query` string parameter containing the search keywords. The query MUST be non-empty.

#### Scenario: Empty query
- **WHEN** `query` is empty or whitespace-only
- **THEN** the tool returns a JSON response with an empty results array and an error message

### Requirement: Max results parameter
The tool SHALL accept an optional `max_results` integer parameter (default: 5, maximum: 10) controlling how many results are returned.

#### Scenario: Default results count
- **WHEN** `max_results` is not provided
- **THEN** at most 5 results are returned

#### Scenario: Custom results count
- **WHEN** `max_results` is provided as 8
- **THEN** at most 8 results are returned

### Requirement: Time limit parameter
The tool SHALL accept an optional `timelimit` parameter with values `d` (day), `w` (week), `m` (month), `y` (year), or empty for no limit, filtering results by recency.

#### Scenario: Day filter
- **WHEN** `timelimit` is `d`
- **THEN** only results from the past day are returned

### Requirement: Loading status message
The tool SHALL accept a `loading_message` string parameter. Before executing the search, the tool MUST publish a JSON data message `{"type": "loading-status", "text": "<loading_message>"}` to the LiveKit room on the `loading-status` topic.

#### Scenario: Loading message published
- **WHEN** `search_internet` is called with `loading_message` "Surfing the web waves..."
- **THEN** a data message with type `loading-status` and text "Surfing the web waves..." is published to the room before the search executes

#### Scenario: Loading message publish failure
- **WHEN** publishing the loading status fails
- **THEN** the search still executes and returns results (failure is logged, not propagated)

### Requirement: Result normalization
The service function SHALL normalize DuckDuckGo responses into a consistent `{"results": [...]}` JSON structure, stripping unnecessary fields (image tokens, embed HTML, etc.) to minimize LLM context usage.

#### Scenario: Text results normalized
- **WHEN** a text search returns raw DDGS results
- **THEN** each result contains only `title`, `href`, and `body` fields

#### Scenario: News results normalized
- **WHEN** a news search returns raw DDGS results
- **THEN** each result contains only `date`, `title`, `body`, `url`, and `source` fields

#### Scenario: Video results normalized
- **WHEN** a video search returns raw DDGS results
- **THEN** each result contains only `title`, `description`, `content`, `publisher`, and `duration` fields

### Requirement: Error handling
The tool SHALL catch all exceptions from the DuckDuckGo library and return a JSON response with an empty results array and an error description.

#### Scenario: Rate limit error
- **WHEN** DuckDuckGo returns a rate limit error
- **THEN** the tool returns `{"results": [], "error": "rate limited"}` 

#### Scenario: Timeout error
- **WHEN** the search times out
- **THEN** the tool returns `{"results": [], "error": "search timed out"}`

### Requirement: Prompt integration
The `bmo.json` prompt file SHALL include tool rules instructing the LLM when to use `search_internet` and how to provide the `loading_message` parameter.

#### Scenario: LLM knows when to search
- **WHEN** the user asks a general knowledge or current events question not covered by Obsidian notes
- **THEN** the LLM invokes `search_internet` with an appropriate query and loading message

### Requirement: Dependency installation
The `pyproject.toml` SHALL include `duckduckgo-search` as a project dependency.

#### Scenario: Package installable
- **WHEN** `pip install` is run against the project
- **THEN** `duckduckgo-search` is installed as a dependency
