## Context

The current frontend layout is a simple vertical flex column: BMO face centered in the middle, audio visualizer + mic controls stacked at the bottom. The Screen component has a fixed `h-64` height, and the controls area lacks visual cohesion (BarVisualizer and ControlBar are separate stacked elements). The layout needs to look like a real BMO game console with hardware elements.

## Goals / Non-Goals

**Goals:**
- Redesign the layout to resemble BMO's physical console (screen, cassette slot, LED, DPad, action buttons)
- Move the face to the top of the viewport (remove vertical centering)
- Replace the bottom controls bar with an integrated mute button (big red circle)
- Add hardware-style interactive elements with 3D press animations
- Add an LED status indicator that reacts to agent audio volume
- Use 16:10 aspect ratio for the screen instead of fixed height

**Non-Goals:**
- No responsive breakpoints (deferred to a future change)
- No header / status bar
- No new agent features or API changes
- No theme system or dark mode

## Decisions

### 1. Top-aligned BMO face
Move the Screen to the top of the Body by removing `flex-1 items-center justify-center` wrapper. Face flows naturally from top.

### 2. FirstRow: Cassette slot + LED indicator
Below the Screen, a horizontal row with:
- **Cassette slot**: wide squircle (`flex-1`, `rounded-lg`) with depth-box inset (outer `#0A3A2E`, inner `#0D4538`, inner height 50%)
- **LED indicator**: circle (`w-10 h-10`, `rounded-full`) with state-driven color and audio-reactive glow

LED states: Offline (`#0E3A6B`, no glow), Connected (`#165BA9`, no glow), Talking (`#22C55E`, green glow scaled by agent audio volume).

### 3. SecondRow: Two-column button layout
Two columns with `justify-between`:
- **Left column** (`items-start`): DPad + StartSelect, flushed left
- **Right column** (`items-end`): Triangle + green circle (in sized containers at 80% DPad height) + big red mute circle, flushed right

### 4. 3D button press system
All buttons share a 3-layer pattern:
1. Sharp shadow (`rgba(13, 81, 66, 0.5)`, fades to opacity 0 on press)
2. Extrusion layer (auto-darkened 30%, fixed position)
3. Main button (slides down 5px on press via translateY)

Reusable `useButtonPress` hook handles mouse, touch, and keyboard events.

### 5. Big red circle as mute toggle
Replace the bottom `ControlBar` and `AgentAudioBar` entirely. The 136px dark red (`#900030`) circle is the sole mute control:
- **Unmuted**: shows mic SVG icon in `#720026`
- **Muted**: no icon

Uses `useLocalParticipant` from LiveKit to toggle `setMicrophoneEnabled`.

### 6. DPad design
Yellow cross-shaped pad (`#FFE249`) with 4 arms (48px length × 40px width). 3D extrusion in `#C4AA1A`. Only outer edges rounded. Responds to click/touch and arrow key presses.

### 7. useTrackVolume hook
Web Audio API analyser for real-time volume (0–1 normalized). Used to drive LED glow intensity when agent is speaking.

### 8. LedState enum and BmoLayout component
Agent visual state lifted into `BmoLayout` component. Computes `ledState` and `glowIntensity` from connection state + agent state + audio volume. Passes down to FirstRow and SecondRow.

## Risks / Trade-offs

- [Risk] Web Audio API analyser may not work in all browsers → Mitigation: graceful fallback to 0 volume
- [Trade-off] Removed ControlBar entirely — no camera/screenshare controls → Accepted, this is a voice-only agent
- [Trade-off] No responsive breakpoints yet → Accepted, deferred to future change
