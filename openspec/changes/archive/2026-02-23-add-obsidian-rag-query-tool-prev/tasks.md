## 1. Obsidian Tool Plumbing

- [x] 1.1 Add Obsidian search endpoint configuration (default URL + optional env override)
- [x] 1.2 Implement async HTTP helper to call Obsidian RAG search API and return JSON text

## 2. Agent Tool Exposure

- [x] 2.1 Add `obsidian-query` `@function_tool` on `Assistant` that calls the helper and returns results
- [x] 2.2 Ensure failures return a safe JSON payload (empty results + error message) without logging note contents

## 3. Verification

- [x] 3.1 Run a targeted syntax check (`python -m compileall agent.py`) and fix any issues introduced
