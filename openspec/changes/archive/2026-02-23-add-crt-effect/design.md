## Context

The BMO interface currently lacks the retro feel of an old CRT monitor. Adding a CRT effect (scanlines, vignette, flicker) will enhance the visual authenticity of the character's screen.

## Goals / Non-Goals

**Goals:**
- Implement a CSS-only CRT effect overlay on the BMO screen.
- Ensure the effect is performant and does not interfere with screen content readability.

**Non-Goals:**
- Complex SVG filters or WebGL shaders for extreme distortion.
- Interactive distortion effects based on user input.

## Decisions

- **CSS-only approach**: We will use CSS pseudo-elements (`::before`, `::after`) or a dedicated overlay `div` with CSS animations and gradients to create the scanlines, vignette, and flicker. This is lightweight and easy to implement within the existing React/Tailwind setup.
- **Overlay Component**: The effect will be applied as an absolute positioned overlay on top of the `Screen` component, with `pointer-events: none` to ensure it doesn't block interactions.
- **Subtle warp**: Apply a low-amplitude transform animation to the rendered screen content container to mimic CRT geometry distortion without requiring WebGL.

## Risks / Trade-offs

- **Risk**: The flicker effect might be distracting or cause accessibility issues.
  - **Mitigation**: Keep the flicker very subtle and consider adding a way to disable it if necessary (though not in scope for this initial implementation).
