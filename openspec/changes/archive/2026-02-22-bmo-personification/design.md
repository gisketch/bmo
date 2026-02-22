## Context

The frontend is a React + Vite SPA using `@livekit/components-react` for voice agent interaction. Currently it's a dark-themed utilitarian UI with text labels and bar visualizers. The reference BMO design uses Tailwind CSS utility classes, SVG-based mouth/eye rendering, and a component-per-file architecture. The agent backend (Python, LiveKit Agents 1.4) and token server (Express) are unchanged.

## Goals / Non-Goals

**Goals:**
- Full-screen mobile-first BMO character that fills the viewport (no device frame)
- Clean component architecture with each BMO part in its own file
- Type-safe state system for mouth states, eye states, and agent visual states
- Map LiveKit agent states to BMO visual states automatically
- Keep existing LiveKit session management, audio rendering, and mic controls
- Integrate BarVisualizer and mic controls at the bottom of the BMO layout

**Non-Goals:**
- Complex eye state animations (only "normal" + blink for now)
- Sound effects or haptic feedback
- Desktop-specific layouts or responsive breakpoints beyond mobile-first
- Changing the token server or agent backend
- Debug controls panel (reference had one — we replace it with live agent state mapping)

## Decisions

### 1. Tailwind CSS via Vite plugin
**Decision**: Add `tailwindcss` and `@tailwindcss/vite` as dev dependencies, configure via Vite plugin.
**Rationale**: The reference design uses Tailwind classes exclusively. The Vite plugin (@tailwindcss/vite) is the recommended v4 integration — no PostCSS config or tailwind.config needed. Replaces `App.css` entirely.
**Alternative**: Keep plain CSS — rejected because it would mean rewriting all the reference SVG component styles from Tailwind to vanilla CSS, adding maintenance burden.

### 2. Component file structure
**Decision**: `src/components/bmo/` directory with `Body.tsx`, `Eye.tsx`, `Mouth.tsx`, `Face.tsx`, `Screen.tsx`, plus `index.ts` barrel export.
**Rationale**: Each component has distinct rendering logic (especially Mouth with SVG paths). Separate files enable independent iteration and future extensibility.
**Alternative**: Single file with all components — rejected for maintainability at this scale (7+ components).

### 3. State types in dedicated module
**Decision**: `src/types/bmo.ts` exports `MouthState` (enum), `EyeState` (enum), and `AgentVisualState` (union type mapped from agent states).
**Rationale**: Centralizes the state contract. Adding new mouth/eye states in the future only requires editing this file and the consuming component.
**Alternative**: Inline string literals — rejected because it makes state mapping error-prone and non-exhaustive.

### 4. Agent state mapping in App.tsx
**Decision**: A `useAgentVisualState()` hook (or inline logic in App) maps `agent.state` and `connectionState` to `{ mouthState, eyeState }` and passes them down.
**Rationale**: Keeps the mapping logic in one place, separate from visual rendering. The BMO components stay pure — they receive state props and render.
**Alternative**: Each BMO component subscribes to agent state — rejected because it couples visual components to LiveKit SDK.

### 5. Body as full-screen background (not mobile frame)
**Decision**: The Body component renders a full-viewport `div` with the BMO teal (#3FD4B6) background and flex column layout. No border, no border-radius simulating a phone.
**Rationale**: User explicitly requested "the BODY is now just the whole background of the page" and "MOBILE FIRST". The device frame from the reference is a desktop demo artifact.

### 6. Keep @livekit/components-react ControlBar
**Decision**: Retain `ControlBar` from the LiveKit React SDK for mic controls, positioned at the bottom over the BMO background.
**Rationale**: Already works, handles mute/unmute state, and matches the spec. Minimal styling override needed to blend with the teal background.

## Risks / Trade-offs

- **[Risk] Tailwind v4 breaking changes** → Mitigated by using the stable `@tailwindcss/vite` plugin which is the official v4 path.
- **[Risk] SVG mouth rendering performance on low-end mobile** → Mitigated by keeping SVGs lightweight (no filters, no complex gradients) and using CSS transforms for blink animation instead of SVG animation.
- **[Trade-off] No debug controls** → The reference had manual mouth-state buttons. We lose manual testing convenience but gain a cleaner production UI. Developers can temporarily add debug controls if needed.
- **[Trade-off] Eye states architecture without implementation** → We define `EyeState` type but only implement "normal". This is intentional scaffolding for future work, not dead code.
