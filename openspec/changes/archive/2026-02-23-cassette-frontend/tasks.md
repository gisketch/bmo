## 1. Cassette message state

- [x] 1.1 Replace console-only cassette logging with a stored `cassetteMessage` state (title + content)
- [x] 1.2 Ignore malformed payloads or messages missing required fields

## 2. Cassette slot rendering

- [x] 2.1 Default cassette slot to empty (no cassette rendered)
- [x] 2.2 Render a cassette when `cassetteMessage` is present and use `title` for the sticker label
- [x] 2.3 Remove press-to-eject/insert interaction from the cassette slot

## 3. Cassette modal (placeholder)

- [x] 3.1 Clicking the cassette opens a modal
- [x] 3.2 Modal renders the cassette `content` text and can be dismissed (backdrop/Esc)
