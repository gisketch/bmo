## Why

The BMO interface currently has a static cassette slot. Adding an animation when the user clicks the cassette slot will make the interface feel more interactive and alive, enhancing the personification of BMO.

## What Changes

- Add an animation to the cassette slot that triggers when clicked.
- The animation will simulate a cassette being inserted or ejected.
- Play cassette in/out SFX during insert/eject.

## Capabilities

### New Capabilities
- `bmo-cassette-animation`: Defines the behavior and visual states of the cassette slot animation.

### Modified Capabilities
- `frontend`: Update the frontend components to support the new animation state and trigger.

## Impact

- `frontend/src/components/bmo/Cassette.tsx`: Will be updated to include animation logic and state.
- `frontend/src/components/bmo/FirstRow.tsx`: Will be updated to hide slot overlay layers when cassette is ejected.
- `frontend/src/sfx.ts`: Will be updated to support cassette SFX pools.
