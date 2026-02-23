## Why

The frontend has grown organically as features were added, and some UI/layout behaviors can be tightened up for better consistency and responsiveness. An incremental UX polish pass keeps the experience cohesive without a redesign.

## What Changes

- Improve screen and page layout responsiveness while preserving the existing visual design system.
- Replace the Screen hard aspect ratio sizing with a layout that fills the remaining vertical space.
- Improve touch reliability for Start/Select interactions.
- Add a disconnected “screen off” presentation with CRT-style power on/off transitions.
- Add lightweight SFX feedback (buttons/body/screen taps and screen power on/off) with preload on startup.
- Add an initial cassette visual in the cassette slot with a paper label and handwritten text.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `frontend`: Adjust layout and rendering requirements for key UI components to support incremental UX polish.

## Impact

- **Frontend UI**: Updates under `frontend/src/components/bmo/` (layout/styling changes).
- **Audio**: New SFX loader and event hooks for UI feedback.
- **Specs**: Delta spec for `frontend` to capture any requirement-level UX behavior changes.
