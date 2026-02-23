## Context

The BMO interface currently has a static cassette slot. We want to add an animation to make it feel more interactive.

## Goals / Non-Goals

**Goals:**
- Add a CSS or SVG animation to the cassette slot.
- Trigger the animation on click.
- Toggle between "inserted" and "ejected" states.

**Non-Goals:**
- Complex 3D animations.
- Tying the animation to actual backend state (for now, it's just a visual effect).

## Decisions

- **Animation Approach**: We will use CSS transitions/animations on the SVG elements within the `Cassette` component. This is lightweight and easy to implement.
- **State Management**: We will use a small state machine in the `Cassette` component to support press, eject, and insert states.
- **Input Handling**: Use pointer events to support touch-first press/release behavior.
- **Clipping Workaround**: Clip the cassette body only at the bottom so the top edge can extend above the slot while still disappearing into it.
- **SFX**: Use the existing pooled audio helpers in `frontend/src/sfx.ts`.

## Risks / Trade-offs

- **Risk**: The animation might look clunky if not timed correctly.
  - **Mitigation**: We will use smooth CSS transitions and adjust the timing until it looks natural.
