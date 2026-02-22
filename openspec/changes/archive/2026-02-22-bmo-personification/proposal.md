## Why

The current frontend is a utilitarian dark-themed UI with plain text status labels and generic bar visualizers. It lacks personality and emotional engagement. A BMO-inspired animated character face gives the voice agent a visual identity — eyes that blink, a mouth that reacts to agent state (listening, talking, thinking, offline) — making the interaction feel alive and expressive. Mobile-first design is critical as users will primarily interact via phone.

## What Changes

- Replace the existing flat dark UI with a BMO-inspired full-screen character face (mobile-first, no device frame)
- Add Tailwind CSS for styling (currently not installed)
- Decompose the face into a component architecture: `Body` (background), `Eye`, `Mouth`, `Face`, `Screen`
- Introduce a state machine mapping LiveKit agent states to visual character states (Listening → Smile, Talking → TalkHappy, Thinking → MouthOh, Offline → Sad)
- Implement mouth states: Smile, Sad, OpenSmile, OpenSad, MouthOh, TalkHappy, TalkSad (with animated talk frames)
- Implement eye state architecture (currently only "normal" with blink, but extensible for future states)
- Keep existing microphone controls and audio rendering from `@livekit/components-react`
- Keep the BarVisualizer integrated into the new design at the bottom
- Remove the old `StatusBar`, `AgentView`, and `UserMicView` components
- Remove `App.css` in favor of Tailwind utility classes

## Capabilities

### New Capabilities
- `bmo-face`: BMO character face component system — Body, Eye, Mouth, Face, Screen components with state-driven animations, mouth state enum, eye state architecture, and agent-state-to-visual-state mapping

### Modified Capabilities
- `frontend`: Audio visualization moves from standalone BarVisualizer to integrated bottom-of-screen placement within the BMO design; StatusBar/AgentView/UserMicView removed and replaced by the BMO face reflecting agent state; microphone controls and session management remain unchanged

## Impact

- **Code**: `frontend/src/` — replaces `App.tsx` and `App.css` with new component tree under `src/components/bmo/`; new state types under `src/types/`
- **Dependencies**: Add `tailwindcss`, `@tailwindcss/vite` to frontend
- **No API changes**: Token server and LiveKit integration stay the same
- **No breaking changes**: Agent backend is unaffected
