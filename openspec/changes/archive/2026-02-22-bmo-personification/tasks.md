## 1. Setup & Dependencies

- [x] 1.1 Install tailwindcss and @tailwindcss/vite as dev dependencies
- [x] 1.2 Configure Tailwind Vite plugin in vite.config.ts and add @import "tailwindcss" to main CSS entry

## 2. Type System

- [x] 2.1 Create src/types/bmo.ts with MouthState enum, EyeState enum, and AgentVisualState type

## 3. BMO Components

- [x] 3.1 Create src/components/bmo/Eye.tsx — blinking eye dot component accepting EyeState and isBlinking props
- [x] 3.2 Create src/components/bmo/Mouth.tsx — SVG mouth component with all 7 mouth states and talk animation
- [x] 3.3 Create src/components/bmo/Face.tsx — orchestrates eyes + mouth, manages blink timer
- [x] 3.4 Create src/components/bmo/Screen.tsx — face container with depth box styling
- [x] 3.5 Create src/components/bmo/Body.tsx — full-screen teal background layout
- [x] 3.6 Create src/components/bmo/index.ts barrel export

## 4. State Mapping & App Integration

- [x] 4.1 Create src/hooks/useAgentVisualState.ts — maps LiveKit agent state + connection state to MouthState/EyeState
- [x] 4.2 Rewrite src/App.tsx — compose BMO components with LiveKit session, ControlBar, BarVisualizer, and RoomAudioRenderer

## 5. Cleanup

- [x] 5.1 Remove src/App.css (replaced by Tailwind)
