## 1. Agent Tool

- [x] 1.1 Add `present_to_cassette` function tool to `Assistant` class in `bmo/assistant.py` that publishes `{ type, title, content }` JSON to the LiveKit room data channel on topic `cassette`
- [x] 1.2 Add tool rule and description for `present_to_cassette` in `prompts/bmo.json`

## 2. Frontend Listener

- [x] 2.1 Add data-channel event listener in `BmoLayout` (`frontend/src/App.tsx`) that console.logs cassette messages received on topic `cassette`
