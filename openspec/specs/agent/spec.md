# Agent Domain Spec

## Overview
Voice AI agent built on LiveKit Agents framework (Python). Uses a pipelined STT-LLM-TTS architecture.

## Components

### Voice Pipeline
- **STT**: Groq Whisper (`whisper-large-v3-turbo`) via `livekit-plugins-groq`
- **LLM**: Google Gemini 3 Flash (`gemini-3-flash-preview`) via `livekit-plugins-google`
- **TTS**: Fish Audio (custom voice, `s1` model) via `livekit-plugins-fishaudio`
- **VAD**: Silero (local model) via `livekit-plugins-silero`
- **Turn Detection**: Multilingual model (local) via `livekit-plugins-turn-detector`

### Agent Server
- Entry point: `agent.py`
- Agent name: `voice-agent`
- Framework: `livekit-agents ~= 1.4`
- Uses `AgentServer` + `@server.rtc_session` pattern

### Environment Variables
| Variable | Service | Required |
|----------|---------|----------|
| `LIVEKIT_URL` | LiveKit Server | Yes |
| `LIVEKIT_API_KEY` | LiveKit auth | Prod only |
| `LIVEKIT_API_SECRET` | LiveKit auth | Prod only |
| `GROQ_API_KEY` | Groq STT | Yes |
| `GOOGLE_API_KEY` | Google Gemini | Yes |
| `FISH_API_KEY` | Fish Audio TTS | Yes |

## Interfaces
- WebRTC audio in/out via LiveKit rooms
- Agent joins as participant, subscribes to user audio
- Responds with generated speech
