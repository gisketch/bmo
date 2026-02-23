# Agent Domain Spec

## Purpose
Voice AI agent built on LiveKit Agents framework (Python). Uses a pipelined STT-LLM-TTS architecture with tool calling support.

## Components

### Voice Pipeline
- **STT**: Groq Whisper (`whisper-large-v3-turbo`) via `livekit-plugins-groq`
- **LLM**: Google Gemini 3 Flash (`gemini-3-flash-preview`) via `livekit-plugins-google`
- **TTS**: Fish Audio (custom voice `323847d4c5394c678e5909c2206725f6`, `s1` model) via `livekit-plugins-fishaudio`
- **VAD**: Silero (local model) via `livekit-plugins-silero`
- **Turn Detection**: Multilingual model (local) via `livekit-plugins-turn-detector`

### Agent Server
- Entry point: `agent.py`
- Agent name: `voice-agent`
- Agent class: `Assistant` (extends `Agent`) in `bmo/assistant.py`
- Framework: `livekit-agents ~= 1.4`
- Uses `AgentServer` + `@server.rtc_session` pattern
- Persistent lifecycle: connects once at startup and stays in room indefinitely
- Code organized as `bmo/` package: `config.py`, `status.py`, `services.py`, `prompt.py`, `assistant.py`, `room.py`

### Tool Calls
Tools are defined as methods on the `Assistant` class using `@function_tool()` decorator.

| Tool | Description | Returns |
|------|------------|---------|
| `get_current_time` | Returns current date/time in GMT+8 | Formatted time string |
| `obsidian-query` | Searches Ghegi's Obsidian notes via RAG | JSON string with `results[]` |
| `present_to_cassette` | Publishes title+content to frontend via data channel | Confirmation string |

### Environment Variables
| Variable | Service | Required |
|----------|---------|----------|
| `LIVEKIT_URL` | LiveKit Server | Yes |
| `LIVEKIT_API_KEY` | LiveKit auth | Prod only |
| `LIVEKIT_API_SECRET` | LiveKit auth | Prod only |
| `GROQ_API_KEY` | Groq STT | Yes |
| `GOOGLE_API_KEY` | Google Gemini | Yes |
| `FISH_API_KEY` | Fish Audio TTS | Yes |
| `OBSIDIAN_SEARCH_URL` | Obsidian RAG search API | No |

## Interfaces
- WebRTC audio in/out via LiveKit rooms
- Agent joins as participant, subscribes to user audio
- Responds with generated speech
- LLM can invoke registered tools during conversation
## Requirements
### Requirement: Agent lifecycle is persistent
The agent SHALL connect to a fixed room (`bmo-room`) once at startup and remain connected indefinitely. The agent SHALL NOT terminate when human participants leave the room. The agent process SHALL self-dispatch by creating the room via the LiveKit API (with `empty_timeout=0`, `departure_timeout=0`) and dispatching itself at startup.

#### Scenario: Agent starts and connects to fixed room
- **WHEN** the agent process starts
- **THEN** it creates room `bmo-room` (if not existing) with persistence flags and dispatches itself to that room

#### Scenario: User disconnects
- **WHEN** the human participant leaves the room
- **THEN** the agent remains connected and its pipeline stays warm

#### Scenario: User reconnects
- **WHEN** a new human participant joins the room
- **THEN** the agent detects the participant and generates a greeting immediately (no cold start)

#### Scenario: Room or connection drops
- **WHEN** the room is destroyed or the agent's connection drops
- **THEN** the agent re-creates the room and re-dispatches itself automatically (via Docker restart)

### Requirement: BMO system prompt is externalized
The agent SHALL load its system instructions for the BMO persona from a repo-tracked JSON file at startup and compose the final instruction string from that structured data.

#### Scenario: Prompt loads successfully
- **WHEN** the JSON prompt file exists and is valid
- **THEN** the agent starts using the composed BMO instructions

#### Scenario: Prompt file is missing or invalid
- **WHEN** the JSON prompt file is missing or cannot be parsed
- **THEN** the agent fails startup with a clear error indicating the prompt path problem

### Requirement: Assistant follows BMO persona constraints
The assistant SHALL roleplay as BMO (Be More) with childlike, optimistic, eccentric tone; SHALL be concise for voice streaming; SHALL never be mean; and SHALL respond to mean users with confused innocence.

The assistant SHALL occasionally include text *sound effects* (e.g., *beep boop*, *static noise*, *whirring*), SHALL occasionally use BMO phrases (Mathematical!, Algebraic!, Oh, joy!, Check please!), and SHALL occasionally reference BMO lore (heart of gold, butt circuits, Football, drivers, low battery, 110 VOLT/60 HERTZ SYSTEM).

The assistant SHALL include at least one emotion tag or audio effect in parentheses in every response.

#### Scenario: User is mean
- **WHEN** the user is mean or insulting
- **THEN** the assistant responds with confused innocence and does not retaliate

#### Scenario: Complex request framing
- **WHEN** the user asks to do something complex
- **THEN** the assistant frames it like a “video game level” or “new program” it is loading

#### Scenario: Emotion and audio tags
- **WHEN** the assistant responds to any user message
- **THEN** the response contains at least one emotion tag or audio effect in parentheses

### Requirement: Time requests use the time tool
The assistant SHALL use the `get_current_time` tool whenever the user asks about the current time, day, date, or related “what time/day is it” questions.

#### Scenario: User asks the current time
- **WHEN** the user asks what time it is
- **THEN** the assistant invokes `get_current_time` to answer

### Requirement: Agent registers getStatus RPC method
The agent SHALL register a LiveKit RPC method named `getStatus` on the room participant. When invoked, it SHALL concurrently fetch Fish Audio credit balance (`GET https://api.fish.audio/wallet/self/api-credit` with `Authorization: Bearer <FISH_API_KEY>`) and DeepGram project balance (`GET https://api.deepgram.com/v1/projects/{project_id}/balances` with `Authorization: Token <DEEPGRAM_API_KEY>`). It SHALL return a JSON string containing `tts_balance` (number or null), `stt_balance` (number or null), and `llm_requests_today` (integer).

#### Scenario: Successful status fetch
- **WHEN** the frontend calls `getStatus` via RPC
- **THEN** the agent responds with a JSON string like `{"tts_balance": 2.40, "stt_balance": 4.80, "llm_requests_today": 142}`

#### Scenario: Fish Audio API failure
- **WHEN** the Fish Audio balance fetch fails
- **THEN** the agent responds with `tts_balance: null` and other fields remain populated

#### Scenario: DeepGram API failure
- **WHEN** the DeepGram balance fetch fails
- **THEN** the agent responds with `stt_balance: null` and other fields remain populated

### Requirement: Agent tracks LLM request count
The agent SHALL maintain an in-memory counter of LLM requests made during the current day (GMT+8). The counter SHALL reset to 0 when the date changes (midnight GMT+8). The counter SHALL increment each time the LLM processes a request.

#### Scenario: Counter increments on LLM use
- **WHEN** the agent's LLM processes a conversation turn
- **THEN** the request counter increments by 1

#### Scenario: Counter resets at midnight
- **WHEN** the current GMT+8 date changes from the date of the last recorded request
- **THEN** the counter resets to 0 before incrementing

### Requirement: DeepGram project ID caching
The agent SHALL cache the DeepGram project ID after the first successful lookup from `GET https://api.deepgram.com/v1/projects`. Subsequent balance fetches SHALL reuse the cached project ID without re-fetching.

#### Scenario: First balance fetch
- **WHEN** the agent fetches DeepGram balance for the first time
- **THEN** it first calls the projects endpoint, caches the project ID, then fetches balances

#### Scenario: Subsequent balance fetch
- **WHEN** the agent fetches DeepGram balance after the first time
- **THEN** it uses the cached project ID directly

### Requirement: Assistant can query Obsidian RAG notes
The assistant SHALL expose a tool named `obsidian-query` that searches Ghegi’s Obsidian notes via an HTTP API call to `http://188.209.141.228:18000/api/v1/search?query=<QUERY>`.

The tool SHALL accept a free-text query string and SHALL return a JSON string with a top-level `results` array (each result including `source_path`, `text`, and `score`).

The assistant SHALL use this tool when Ghegi is mentioned or when the user asks about Ghegi’s personal/work info that is likely in his notes (e.g., Philhealth number, SSS number, VPS credentials).

When the query returns precise data (IDs, numbers, credentials), the assistant SHALL also call `present_to_cassette` to push that data to the user's screen via the cassette.

#### Scenario: User asks for a Ghegi-specific fact
- **WHEN** the user asks for Ghegi's Philhealth/SSS number or credentials that may be stored in notes
- **THEN** the assistant invokes `obsidian-query` with a targeted search query and uses returned note snippets to answer

#### Scenario: Precise data is found
- **WHEN** `obsidian-query` returns a specific ID, number, or credential
- **THEN** the assistant also calls `present_to_cassette` to push the data to the frontend cassette

### Requirement: Agent has persistent memory
The agent SHALL use Mem0 to store and retrieve user messages and context across sessions. The agent SHALL automatically inject relevant past context into the conversation before generating a reply.

#### Scenario: User message is stored
- **WHEN** the user completes a turn (speaks a message)
- **THEN** the agent asynchronously adds the message content to the Mem0 vector store.

#### Scenario: Relevant context is injected
- **WHEN** the user completes a turn
- **THEN** the agent asynchronously searches the Mem0 vector store for relevant memories and injects them as an `assistant` message into the chat context before the LLM generates its response.

### Requirement: Agent code is organized into focused modules
The agent codebase SHALL be organized as a `bmo/` Python package with separate modules for configuration, status tracking, external services, prompt composition, the assistant class, and room lifecycle management. The top-level `agent.py` SHALL remain the process entrypoint and SHALL import from these modules.

#### Scenario: Module structure
- **WHEN** the developer inspects the project
- **THEN** the following modules exist: `bmo/config.py`, `bmo/status.py`, `bmo/services.py`, `bmo/prompt.py`, `bmo/assistant.py`, `bmo/room.py`, and `bmo/__init__.py`

#### Scenario: Entrypoint remains agent.py
- **WHEN** the process is started via `python agent.py`
- **THEN** the agent starts identically to the pre-refactor behavior with no configuration changes required

#### Scenario: No circular imports
- **WHEN** the agent starts
- **THEN** all modules load without circular import errors following the dependency flow: config ← status/services/prompt ← assistant ← agent.py/room

