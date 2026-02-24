## 1. Backend — Loading status message from obsidian-query

- [x] 1.1 Add `loading_message: str` parameter to `obsidian_query` tool and publish `{ "type": "loading-status", "text": "<loading_message>" }` on topic `loading-status` via `room.local_participant.publish_data` before calling `fetch_obsidian_search`
- [x] 1.2 Update `prompts/bmo.json` — add tool rule requiring BMO to provide a creative loading_message for obsidian-query, and update the tool description to mention the parameter

## 2. Frontend — LoadingWithInfo state from data channel

- [x] 2.1 In `App.tsx`, add a `loading-status` data-channel listener that sets `loadingStatusText` state when a message arrives
- [x] 2.2 Wire `loadingStatusText` into the faceState/faceMode cascade: when `loadingStatusText` is set, override `faceMode='loading'` and pass the text as `loadingText`; priority: below override/shake/beepBoop, above thinking pose
- [x] 2.3 Clear `loadingStatusText` when `agent.state` changes away from `thinking` or when connection is lost
