## Why

To enhance the retro aesthetic of the BMO interface, we need to add a CRT (Cathode Ray Tube) effect to the screen. This will make the digital interface feel more authentic and aligned with the character's design.

## What Changes

- Add a CSS-based CRT effect overlay to the BMO screen component.
- The effect will include scanlines, a subtle vignette, and a slight flicker to simulate an old CRT monitor.
- Ensure the effect does not interfere with the readability or interactivity of the screen content.

## Capabilities

### New Capabilities
- `bmo-crt-effect`: Defines the visual requirements and behavior of the CRT screen overlay.

### Modified Capabilities
- `frontend`: Update the frontend styling to incorporate the CRT effect on the main screen component.

## Impact

- **Frontend**: CSS/Tailwind updates to the `Screen.tsx` or a new overlay component.
- **Performance**: Minimal impact, as the effect will be CSS-only.
