## MODIFIED Requirements

### Requirement: Search modes
The `search_internet` tool SHALL accept a `topic` parameter with values `general`, `news`, or `finance`. The topic determines which Tavily search category is used. Default: `general`.

#### Scenario: General search
- **WHEN** `topic` is `general`
- **THEN** the tool performs a broad web search via Tavily

#### Scenario: News search
- **WHEN** `topic` is `news`
- **THEN** the tool performs a news-focused search via Tavily

#### Scenario: Finance search
- **WHEN** `topic` is `finance`
- **THEN** the tool performs a finance-focused search via Tavily

#### Scenario: Invalid topic
- **WHEN** `topic` is not one of the valid values
- **THEN** the tool defaults to `general`

### Requirement: Time limit parameter
The tool SHALL accept an optional `time_range` parameter with values `day`, `week`, `month`, `year`, or empty for no limit, filtering results by recency.

#### Scenario: Day filter
- **WHEN** `time_range` is `day`
- **THEN** only results from the past day are returned

### Requirement: Result normalization
The service function SHALL normalize Tavily responses into a consistent `{"results": [...]}` JSON structure containing `title`, `url`, `content`, and `score` fields per result.

#### Scenario: Results normalized
- **WHEN** a search returns Tavily results
- **THEN** each result contains `title`, `url`, `content`, and `score` fields

### Requirement: Error handling
The tool SHALL catch all exceptions from the Tavily client and return a JSON response with an empty results array and an error description.

#### Scenario: API error
- **WHEN** Tavily returns an error
- **THEN** the tool returns `{"results": [], "error": "<description>"}`

### Requirement: Dependency installation
The `pyproject.toml` SHALL include `tavily-python` and SHALL NOT include `duckduckgo-search`.

#### Scenario: Package installable
- **WHEN** `pip install` is run against the project
- **THEN** `tavily-python` is installed and `duckduckgo-search` is not required
