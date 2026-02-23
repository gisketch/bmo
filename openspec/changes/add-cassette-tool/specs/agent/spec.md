## MODIFIED Requirements

### Requirement: Assistant can query Obsidian RAG notes
The assistant SHALL expose a tool named `obsidian-query` that searches Ghegi's Obsidian notes via an HTTP API call to `http://188.209.141.228:18000/api/v1/search?query=<QUERY>`.

The tool SHALL accept a free-text query string and SHALL return a JSON string with a top-level `results` array (each result including `source_path`, `text`, and `score`).

The assistant SHALL use this tool when Ghegi is mentioned or when the user asks about Ghegi's personal/work info that is likely in his notes (e.g., Philhealth number, SSS number, VPS credentials).

When the query returns precise data (IDs, numbers, credentials), the assistant SHALL also call `present_to_cassette` to push that data to the user's screen via the cassette.

#### Scenario: User asks for a Ghegi-specific fact
- **WHEN** the user asks for Ghegi's Philhealth/SSS number or credentials that may be stored in notes
- **THEN** the assistant invokes `obsidian-query` with a targeted search query and uses returned note snippets to answer

#### Scenario: Precise data is found
- **WHEN** `obsidian-query` returns a specific ID, number, or credential
- **THEN** the assistant also calls `present_to_cassette` to push the data to the frontend cassette
