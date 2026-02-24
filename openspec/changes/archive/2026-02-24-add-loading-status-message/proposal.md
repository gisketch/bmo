## Why

When BMO calls `obsidian-query`, the frontend sits in the generic "thinking" face with no feedback about what's happening. The user sees the same idle thinking pose whether the agent is processing language or waiting on a network call. Adding a loading status message gives the user visible, BMO-flavored feedback during tool calls that involve I/O.

## What Changes

- Add a `loading_message` parameter to the `obsidian-query` tool so the LLM can send a BMO-ish status message before the search executes.
- Publish loading status messages over LiveKit's data channel (same pattern as cassette) so the frontend receives them during tool execution.
- Frontend transitions from "thinking" face to "LoadingWithInfo" screen when a loading status message arrives, displaying the LLM-generated text.
- Frontend clears the loading override when the agent state changes (e.g., agent starts speaking), returning to the standard agent-driven visual state (talking, listening, etc.).
- Update the system prompt to instruct BMO to provide a creative, BMO-style loading message when calling `obsidian-query`.

## Capabilities

### New Capabilities

- `loading-status`: Defines the loading status data-channel message, the tool-level parameter, and the frontend state transition from thinking → LoadingWithInfo → agent-driven state (clears when agent state changes).

### Modified Capabilities

- `cassette-tool`: The `obsidian-query` tool gains a `loading_message` parameter and publishes a loading status message before executing the search.
- `frontend`: Frontend adds a reactive loading override: when a loading status message is received, switch screen to LoadingWithInfo. Clear override when agent state changes away from thinking (agent-driven state resumes).

## Impact

- **Backend**: `bmo/assistant.py` — `obsidian_query` tool signature and body.
- **Frontend**: `frontend/src/App.tsx` — new data-channel listener for `loading-status` topic, new state wiring for `faceMode`/`loadingText`.
- **Prompt**: `prompts/bmo.json` — new tool rule + description update for `obsidian-query`.
- No new dependencies. Uses existing LiveKit data-channel and `LoadingWithInfo` component.
