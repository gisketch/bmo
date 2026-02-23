## 1. Audit and define targets

- [x] 1.1 Identify the specific layout inconsistencies to fix (Face, StatusPage, Screen, container spacing/overflow).
- [x] 1.2 Capture before/after acceptance notes for at least 2 viewport sizes.

## 2. Implement incremental UX polish

- [x] 2.1 Adjust Screen/container layout to prevent overflow/clipping in constrained viewports.
- [x] 2.2 Ensure Face and StatusPage align consistently within Screen when toggling pages.

## 3. Interaction + feedback polish

- [x] 3.1 Fix touch reliability for Start/Select interactions (avoid double-toggle).
- [x] 3.2 Add disconnected screen-off state and CRT power on/off animation.
- [x] 3.3 Add UI SFX system with preload and event hooks.
- [x] 3.4 Add initial cassette visual with label (StickerPaper + text).

## 4. Verification

- [x] 4.1 Run frontend typecheck/build and confirm no new TypeScript errors.
- [x] 4.2 Validate the UX changes match the delta spec scenarios.
