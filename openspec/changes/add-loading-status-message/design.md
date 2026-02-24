## Context

BMO currently uses LiveKit's data channel to send cassette messages from the agent to the frontend (topic: `cassette`). The frontend has a `LoadingWithInfo` component that shows typewriter-animated text, but it's only wired through the test override system — no production code path triggers it. When `obsidian-query` runs, the user sees the generic thinking face with no indication of what's happening.

## Goals / Non-Goals

**Goals:**
- Send a loading status message from the backend to the frontend before `obsidian-query` executes its network call.
- Display the loading message on-screen via the existing `LoadingWithInfo` component.
- Clear the loading state automatically when the agent state changes (e.g., agent starts speaking).
- Prompt the LLM to generate creative, BMO-flavored loading messages.

**Non-Goals:**
- Generalizing loading messages to all tools — only `obsidian-query` for now.
- Adding progress bars or percentages.
- Modifying the `LoadingWithInfo` component itself.

## Decisions

**Data channel topic: `loading-status`**
Reuses the same LiveKit `publish_data` pattern as cassette. Separate topic avoids collision with cassette messages. Payload: `{ "type": "loading-status", "text": "<message>" }`.

**LLM generates the message via tool parameter**
The `obsidian-query` tool gains a `loading_message: str` parameter. The LLM fills it in based on a prompt rule. This keeps messages contextual and creative without hardcoding phrases. The agent publishes the message before calling the search service.

**Frontend clears loading on agent state change**
No explicit "clear" message from backend — the frontend watches `agent.state` and clears the loading override whenever it transitions away from `'thinking'`. This is simpler and avoids race conditions with an explicit clear message.

**Loading override priority sits below face override (test mode) but above the thinking pose**
In the faceState cascade in App.tsx, loading mode slots in so that: override preset > shake > beepBoop > loading > thinking > cassette > base.

## Risks / Trade-offs

**[Risk]** LLM might not always provide a loading_message → **Mitigation**: Make the parameter required in the tool signature. The prompt rule explicitly instructs BMO to always include one.

**[Risk]** Very fast obsidian queries may flash the loading screen briefly → **Mitigation**: Acceptable UX — the typewriter animation naturally handles short display times gracefully. No minimum display time needed.

**[Trade-off]** No explicit "clear" message means the loading screen persists until agent state changes → This is intentional and matches how the thinking pose already works. The agent always transitions to speaking or listening after tool execution.
