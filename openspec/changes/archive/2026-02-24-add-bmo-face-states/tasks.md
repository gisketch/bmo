## 1. Artifacts & Types

- [x] 1.1 Validate proposal/spec/design artifacts with `openspec status`
- [x] 1.2 Implement face override presets and wiring without breaking existing usage

## 2. Cassette-Driven Face Overrides

- [x] 2.1 Detect cassette insert/eject phases in `BmoLayout` and apply a transient “cassette interaction” face override
- [x] 2.2 Ensure override priority behaves correctly when offline

## 3. Face Override Test Mode (Triangle + DPad)

- [x] 3.1 Repurpose Triangle button to toggle “TEST MODE” face override on/off (no longer toggles screen/disconnect)
- [x] 3.2 Add DPad left/right handlers to cycle through available face states while override is enabled
- [x] 3.3 Render a simple `TEST MODE` label at the top of the UI while override is enabled
- [x] 3.4 Add a "Shake" face preset (closed eyes + OpenSmile) that shakes the face for ~300ms on entry
- [x] 3.5 Add a 30% chance shake on glass taps (transient 300ms override)
- [x] 3.6 Debounce tap/button SFX to prevent double-trigger in mobile responsive mode
- [x] 3.7 Play random BMO chuckle SFX when shake triggers
- [x] 3.8 Add BeepBoop pulse on every button press (beep/boop SFX + 120ms MouthOh + squished eyes)
- [x] 3.9 Trigger a transient shake when cassette insert begins
- [x] 3.10 Add enhanced Thinking pose (eye offset + flat tilted mouth + slow upward float)
- [x] 3.11 Play random hmm SFX on entering agent thinking state
- [x] 3.12 Create LoadingWithInfo face-replacement state component (Pixeloid font + looping dots), not integrated yet
- [x] 3.13 Integrate LoadingWithInfo into TEST MODE presets
- [x] 3.14 Add LoadingWithInfo padding and typewriter entrance animation

## 4. Verification

- [x] 4.1 Confirm TypeScript diagnostics show no errors for touched files
