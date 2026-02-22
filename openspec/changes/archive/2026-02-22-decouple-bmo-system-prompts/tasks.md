## 1. Prompt Config

- [x] 1.1 Add a repo-tracked JSON file for the BMO system prompt (role, tone, lore, constraints, phrases, tool guidance)

## 2. Agent Integration

- [x] 2.1 Update `agent.py` to load the BMO JSON prompt at startup and compose the `Assistant` instructions from it
- [x] 2.2 Align `get_current_time` tool description/docstring with the BMO persona while preserving functional behavior

## 3. Verification

- [x] 3.1 Run targeted verification (typecheck/compile check) to ensure the agent still starts and imports cleanly
