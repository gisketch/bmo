## ADDED Requirements

### Requirement: Assistant can query Obsidian RAG notes
The assistant SHALL expose a tool named `obsidian-query` that searches Ghegi’s Obsidian notes via an HTTP API call to `http://188.209.141.228:18000/api/v1/search?query=<QUERY>`.

The tool SHALL accept a free-text query string and SHALL return the Obsidian service response as a JSON string with a top-level `results` array (each result including `source_path`, `text`, and `score`).

The assistant SHALL use this tool when Ghegi is mentioned or when the user asks about Ghegi’s personal/work info that is likely in his notes (e.g., Philhealth number, SSS number, VPS credentials).

#### Scenario: User asks for a Ghegi-specific fact
- **WHEN** the user asks for Ghegi’s Philhealth/SSS number or credentials that may be stored in notes
- **THEN** the assistant invokes `obsidian-query` with a targeted search query and uses returned note snippets to answer
