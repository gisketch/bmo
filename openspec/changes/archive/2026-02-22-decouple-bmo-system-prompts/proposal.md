## Why

The voice agent’s personality is currently generic and hard-coded, which makes it tedious to iterate on tone and tool descriptions. We want the agent to consistently roleplay as BMO and keep the prompt content editable without code changes.

## What Changes

- Update the agent’s system instructions to roleplay as BMO (Adventure Time) with the provided tone, phrases, lore beats, and constraints (concise, never mean, add *sound effects*, treat complex asks like “levels/programs”).
- Externalize the BMO system prompt into a JSON file so it can be updated independently of code.
- Load the JSON prompt at runtime in `agent.py` and assemble the final instruction string from structured fields.
- Refresh tool call descriptions (starting with `get_current_time`) to align with the BMO persona while preserving functional intent.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `agent`: The assistant persona/instructions become BMO-driven and prompt text is loaded from a JSON config instead of being fully hard-coded.

## Impact

- `agent.py`: prompt loading + instruction composition; minor tool description tweaks.
- New JSON prompt config file (repo-tracked) used by the agent at startup.
