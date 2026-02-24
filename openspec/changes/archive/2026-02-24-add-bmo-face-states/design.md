## Context

The current BMO face uses `useAgentVisualState()` to map LiveKit agent state and connection state into a single `mouth` + `eye` combination.

Cassette activity and button presses are already represented in the UI as local React state (`cassettePhase`, modal open state, button press handlers), but they do not influence the face.

Constraints:
- This change is frontend-only.
- The existing agent-state mapping remains the default baseline.

## Goals / Non-Goals

**Goals:**
- Introduce a small, explicit transient override layer for the face so UI interactions can briefly change BMO’s expression.
- Add a “cassette sending” override during cassette insert/eject phases.
- Add a developer-focused “TEST MODE” that hard-overrides the face and cycles between predefined face states.
- Preserve current mouth SVG states; prefer recombining existing shapes/animations over adding new art.

**Non-Goals:**
- No backend status field changes.
- No new screens/pages or new UI controls.
- No large refactor of cassette logic.

## Decisions

- Add a transient override mechanism (time-limited) in `BmoLayout` that computes an effective face state:
  - Base layer: `useAgentVisualState()` (agent + connection driven).
  - Override layer: local UI events (cassette insert/eject).
- Add a separate developer test override mode:
  - Triangle toggles TEST MODE on/off.
  - While enabled, DPad left/right cycles through predefined face state presets.
- Define a simple priority order:
  - Connection offline always wins.
  - Otherwise, active overrides win over the base agent state.

## Risks / Trade-offs

- **[Risk]** Overlapping overrides (cassette + button presses) could cause jittery changes → **Mitigation:** treat override as a single slot with “latest wins” and a short duration.
- **[Risk]** Overriding during speaking might look odd → **Mitigation:** keep override durations short and reuse “happy” mouth shapes.
