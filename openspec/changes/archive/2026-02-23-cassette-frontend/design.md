## Context

The agent can publish `{ type: "cassette", title, content }` to the LiveKit reliable data channel on topic `cassette`. The frontend currently listens for these messages and logs them to the console.

## Goals / Non-Goals

**Goals**
- Make cassette messages visible in the UI by rendering a cassette in the slot.
- Default the slot to empty until a cassette message is received.
- Clicking the cassette opens a placeholder modal that renders the cassette content text.

**Non-Goals**
- Designing the final modal UI or cassette reader experience.
- Supporting multiple cassette messages or a queue.
- Reintroducing user-driven eject/insert mechanics.

## Decisions

### 1. State location
**Choice**: Keep the latest cassette message state in `BmoLayout`.
**Rationale**: `BmoLayout` already owns the LiveKit room event listener and passes props into `FirstRow`.

### 2. Cassette visibility
**Choice**: Render no cassette by default; render a cassette only when a valid payload is received.
**Rationale**: Matches desired UX and removes the manual eject/insert state machine.

### 3. Cassette arrival feedback
**Choice**: When a cassette message is received:
- If the slot is empty, play the cassette insert animation + insert SFX.
- If a cassette is already present, play eject animation + eject SFX, swap the cassette content offscreen, then play insert animation + insert SFX.
**Rationale**: Keeps the original tactile feedback while making cassette appearance fully message-driven.

### 4. Placeholder modal
**Choice**: Cassette-themed overlay modal with backdrop blur + slide-up entry, closed via backdrop + Esc.
**Rationale**: Keeps the interaction lightweight while matching the cassette aesthetic.

The modal renders:
- A StickerPaper-style title label.
- An inner CRT-styled screen area that displays content in Geist Mono.

Opening the modal reuses the cassette insert SFX for tactile feedback.

## Payload assumptions

- Topic is `cassette`
- JSON payload contains `title` and `content` as strings
