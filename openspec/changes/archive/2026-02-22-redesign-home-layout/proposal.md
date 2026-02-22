## Why

The current home layout is a basic vertical stack—BMO face centered, controls at the bottom—with a rigid structure. The layout needs a full BMO console redesign: top-aligned face, hardware-style body details (cassette slot, LED indicator, DPad, action buttons), and the controls area replaced with in-body interactive elements.

## What Changes

- Reposition the BMO face/screen to the top (remove vertical centering)
- Add a FirstRow below the screen: cassette slot (depth-box inset) + LED status indicator (audio-reactive glow)
- Add a SecondRow with two columns: left column (DPad + Start/Select buttons), right column (triangle button, green circle button, big red mute circle button)
- Replace the bottom ControlBar + AgentAudioBar with the big red circle button as the sole mute toggle
- Change Screen to 16:10 aspect ratio instead of fixed height
- Lift agent state into BmoLayout component for LED and mute control
- Add 3D button press animations (extrusion layer + sharp shadow + translateY) to all interactive elements
- Create reusable useButtonPress hook for mouse/touch/keyboard press state
- Add useTrackVolume hook for Web Audio API volume analysis (LED glow)
- Add LedState enum and LED_COLORS map for status indicator states

## Capabilities

### New Capabilities

_None — this is a layout/styling rework with mute functionality moved to an in-body button._

### Modified Capabilities

- `frontend`: Layout structure overhauled — bottom controls removed, BmoLayout wrapper added, mute toggle via big red circle button
- `bmo-face`: Screen aspect ratio changed, Body padding/gap restructured, new sub-components (FirstRow, SecondRow, DPad, StartSelect, TriangleButton, CircleButton)

## Impact

- **Files**: `App.tsx`, `Body.tsx`, `Screen.tsx`, `FirstRow.tsx`, `SecondRow.tsx`, `DPad.tsx`, `StartSelect.tsx`, `TriangleButton.tsx`, `CircleButton.tsx`, `index.ts`, `useButtonPress.ts`, `useTrackVolume.ts`, `bmo.ts`
- **Dependencies**: No new dependencies; uses existing Tailwind CSS utilities + Web Audio API
- **APIs**: No API changes
- **Systems**: Visual-only change; no backend or agent pipeline impact
