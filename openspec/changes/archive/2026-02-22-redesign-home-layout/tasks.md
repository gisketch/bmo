## 1. Layout restructure

- [x] 1.1 Move BMO face to top (remove vertical centering wrapper in App.tsx)
- [x] 1.2 Update Body with horizontal padding (px-6) and gap-8 between children
- [x] 1.3 Change Screen from fixed h-64 to 16:10 aspect ratio

## 2. FirstRow — Cassette slot + LED

- [x] 2.1 Create FirstRow component with cassette slot (depth-box inset) and LED indicator
- [x] 2.2 Add LedState enum and LED_COLORS map to types/bmo.ts
- [x] 2.3 Create useTrackVolume hook (Web Audio API analyser for real-time volume)
- [x] 2.4 Wire LED state and glow intensity from BmoLayout through FirstRow

## 3. SecondRow — DPad + Action buttons

- [x] 3.1 Create DPad component (yellow cross, 3D extrusion + shadow + press animation)
- [x] 3.2 Create useButtonPress hook (mouse/touch/keyboard press state)
- [x] 3.3 Create StartSelect component (two thin blue buttons)
- [x] 3.4 Create TriangleButton component (SVG triangle with rounded corners)
- [x] 3.5 Create CircleButton component (generic circle button with extrusion)
- [x] 3.6 Create SecondRow assembling two-column layout (left: DPad + StartSelect, right: action buttons)
- [x] 3.7 Flush first column left, second column right (justify-between)
- [x] 3.8 Add sized containers for triangle (top-aligned) and green circle (bottom-aligned) at 80% DPad height

## 4. Mute toggle via big red circle

- [x] 4.1 Add onClick and children props to CircleButton
- [x] 4.2 Add mute/unmute toggle to big red circle using useLocalParticipant
- [x] 4.3 Show mic SVG icon when unmuted, hide when muted (icon color #720026)

## 5. Remove old controls

- [x] 5.1 Remove AgentAudioBar component and bottom controls area from App.tsx
- [x] 5.2 Clean up unused imports (ControlBar, BarVisualizer)

## 6. BmoLayout wrapper

- [x] 6.1 Create BmoLayout component lifting agent state for LED + mute control
- [x] 6.2 Export new components from bmo/index.ts
