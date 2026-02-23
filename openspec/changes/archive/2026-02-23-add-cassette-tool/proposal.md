## Why

BMO retrieves information for the user (e.g., Philhealth ID via Obsidian query) but can only relay it verbally. Voice is lossy for precise data like ID numbers, credentials, and codes. A "cassette printout" mechanism lets BMO physically present text to the user's screen alongside the spoken response.

## What Changes

- Add a new `present_to_cassette` function tool to the `Assistant` class that publishes a `{ title, content }` payload to the LiveKit room data channel.
- Add a prompt rule instructing BMO when and how to use the cassette tool (present precise data, mention it was sent through the cassette).
- Frontend listens for data-channel messages from the agent and console.logs cassette payloads (visual display deferred to a future change).

## Capabilities

### New Capabilities
- `cassette-tool`: Defines the `present_to_cassette` agent tool and the frontend data-channel listener that receives cassette messages.

### Modified Capabilities
- `agent`: Adds the new tool to the Assistant's tool list and prompt rules.

## Impact

- `bmo/assistant.py` — new `@function_tool` method
- `prompts/bmo.json` — new tool rule + description for `present_to_cassette`
- `frontend/src/App.tsx` — data-channel event listener (console.log only for now)
- No new dependencies; LiveKit data channels are already available in both SDKs.
