## Context

BMO currently has two tools (`get_current_time`, `obsidian-query`). Both return data only to the LLM — the user hears it spoken. For precise data (IDs, credentials), voice is unreliable. The LiveKit room already connects agent and frontend via WebRTC, including a data channel that supports arbitrary payloads.

## Goals / Non-Goals

**Goals:**
- Let the LLM push structured text (title + content) to the frontend in real time via a tool call.
- Frontend receives and logs the payload immediately (console.log for now).

**Non-Goals:**
- Visual cassette UI/animation for displaying the message (future change).
- Persistence or history of cassette messages.
- User-initiated cassette interactions.

## Decisions

### 1. Transport: LiveKit data channel (reliable)
**Choice**: Use `room.local_participant.publish_data` on the agent side with a JSON payload, topic `cassette`.
**Rationale**: Already available in both SDKs. No new infra, no RPC polling needed — it's a push. RPC is request/response and doesn't fit a server-push pattern.
**Alternative considered**: Custom WebSocket server — rejected, adds infra complexity for no benefit.

### 2. Tool accesses room via session context
**Choice**: The `present_to_cassette` tool uses `context.session.room` from the `RunContext` to access the LiveKit room and publish data.
**Rationale**: `RunContext` already carries the session which has the room reference. No need to thread room through constructor or globals.

### 3. Payload schema
```json
{ "type": "cassette", "title": "string", "content": "string" }
```
The `type` field future-proofs the data channel for other message types.

### 4. Frontend listener location
**Choice**: Add the data-received listener in `BmoLayout` (inside `App.tsx`) where `useRoomContext()` is already available.
**Rationale**: Keeps the listener co-located with the room context. When visual display is added later, it can be extracted to a hook.

## Risks / Trade-offs

- [Data channel reliability] → LiveKit reliable data channel guarantees delivery; no risk of lost messages.
- [No visual display yet] → Console.log is temporary. Acceptable since this change focuses on the tool plumbing.
- [Room reference availability in tool] → If `context.session.room` is None (edge case during disconnect), the tool returns an error string to the LLM gracefully.
