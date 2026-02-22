## Context

The current `Assistant` system instructions in `agent.py` are hard-coded and generic. The user wants the agent to consistently roleplay as BMO (Be More) with specific lore, tone, and behavioral constraints. They also want the prompt content to be easy to update over time (ideally without modifying Python), including aligning tool descriptions.

Constraints:
- Voice streaming: responses should be concise.
- Persona requirements include text *sound effects* (e.g., *beep boop*), which conflicts with the current “no asterisks” instruction and must be updated.

## Goals / Non-Goals

**Goals:**
- Externalize the BMO system prompt into a repo-tracked JSON file.
- Compose the `Assistant` instructions string from the JSON at runtime.
- Keep behavior consistent with the BMO constraints: never mean, confused innocence when users are mean, short punchy sentences, occasional machine-logic references, Football, lore beats, and signature phrases.
- Keep tool behavior unchanged, but update tool documentation to match the persona.

**Non-Goals:**
- No changes to STT/LLM/TTS model selection, LiveKit session wiring, or frontend.
- No new tools beyond updating descriptions for existing ones.
- No prompt editor UI.

## Decisions

- **JSON prompt format**: Add a single JSON file (e.g., `prompts/bmo.json`) with structured fields (role, tone, lore, constraints, phrases, tool guidance). This keeps prompt edits small and reviewable.
- **Instruction composition**: Build a single plain-text instruction string by joining sections with newlines. Avoid Markdown bullets in the final instruction string.
- **Startup behavior**: If the JSON file is missing or invalid, fail fast with a clear error. (This prevents silently running the wrong persona.)
- **Asterisk rule update**: Remove the “no asterisks” constraint from the agent instructions so *sound effects* are permitted, while still discouraging heavy formatting and emojis.

## Risks / Trade-offs

- [Prompt drift] JSON changes can unintentionally degrade responses → Keep prompt structured; keep an explicit “constraints” section.
- [Startup failure] Missing JSON prevents agent boot → Clear error message; path is repo-tracked.
- [Over-long prompt] Too much lore harms latency/quality → Keep JSON concise; prefer short lists and compact sentences.
