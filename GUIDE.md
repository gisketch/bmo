# LiveKit Voice Agent — Setup & Running Guide

## Architecture

```
STT: Groq Whisper (whisper-large-v3-turbo)
LLM: Google Gemini 3 Flash (gemini-3-flash-preview)
TTS: Fish Audio (custom voice, s1 model)
VAD: Silero (local)
Turn Detection: Multilingual (local)
```

---

## Prerequisites

| Tool | Install |
|------|---------|
| Python >= 3.10 | [python.org](https://www.python.org/downloads/) |
| uv | `pip install uv` |
| Docker (VPS only) | `curl -fsSL https://get.docker.com \| sh` |

---

## 1. Get API Keys

| Service | Where | Env Variable |
|---------|-------|-------------|
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | `GROQ_API_KEY` |
| Google AI | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | `GOOGLE_API_KEY` |
| Fish Audio | [fish.audio](https://fish.audio) | `FISH_API_KEY` |

Edit `.env.local` with your keys.

### Mem0 Memory Mode

This project uses Mem0 for persistent memory. You can control how aggressively memories are stored/retrieved with `MEM0_SETTING` in `.env.local`.

```
# Default (recommended): stores only durable, categorized memories using a Gemini LLM gatekeeper (uses `GOOGLE_API_KEY`);
# retrieval/injection behavior remains the same (Mem0 is searched on each turn).
MEM0_SETTING=GATED

# Legacy behavior: stores every user turn and runs retrieval on every turn
MEM0_SETTING=NORMAL
```

---

## 2. VPS Setup (one-time)

### Option A: Dev Mode (quick, no domain needed)

```bash
# From your local machine, run:
ssh root@<VPS_IP> 'bash -s' < scripts/setup-dev.sh
```

This starts LiveKit Server at `ws://<VPS_IP>:7880` with no auth.

**Then update `.env.local`:**
```
LIVEKIT_URL=ws://<VPS_IP>:7880
```
Leave `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` empty.

### Option B: Production (requires domain)

1. Point DNS A records to your VPS:
   - `livekit.yourdomain.com` → VPS IP
   - `turn.yourdomain.com` → VPS IP

2. Edit `scripts/setup-prod.sh` — set `DOMAIN` and `TURN_DOMAIN`

3. Run:
   ```bash
   ssh root@<VPS_IP> 'bash -s' < scripts/setup-prod.sh
   ```

4. Save the API key/secret printed at the end, update `.env.local`:
   ```
   LIVEKIT_URL=wss://livekit.yourdomain.com
   LIVEKIT_API_KEY=<from output>
   LIVEKIT_API_SECRET=<from output>
   ```

---

## 3. Download Model Files (one-time)

```bash
uv run agent.py download-files
```

Downloads Silero VAD and Turn Detector model weights locally.

---

## 4. Run the Agent

### Console mode (terminal only, no LiveKit server needed)

```bash
uv run agent.py console
```

Speaks via your mic/speakers directly. Great for quick testing.

### Dev mode (connects to VPS LiveKit server)

```bash
uv run agent.py dev
```

Agent registers with your LiveKit server. Connect via:
- LiveKit Agents Playground (if using LiveKit Cloud)
- Your own frontend
- Any LiveKit client SDK

### Production mode

```bash
uv run agent.py start
```

Or via Docker:
```bash
docker build -t voice-agent .
docker run --env-file .env.local voice-agent
```

---

## 5. Fish Audio Custom Voice

1. Go to [fish.audio](https://fish.audio) → create a voice model
2. Copy the voice model ID (e.g., `8ef4a238714b45718ce04243307c57a7`)
3. In `agent.py`, uncomment and set the `reference_id`:
   ```python
   tts=fishaudio.TTS(
       model="s1",
       reference_id="YOUR_VOICE_ID_HERE",
   ),
   ```

---

## 6. VPS Management

### Dev mode

```bash
# Check status
ssh root@<VPS_IP> 'docker ps'

# View logs
ssh root@<VPS_IP> 'docker logs -f livekit-dev'

# Restart
ssh root@<VPS_IP> 'docker restart livekit-dev'

# Stop
ssh root@<VPS_IP> 'docker rm -f livekit-dev'
```

### Production mode

```bash
# Check status
ssh root@<VPS_IP> 'systemctl status livekit-docker'

# View logs
ssh root@<VPS_IP> 'cd /opt/livekit && docker compose logs -f'

# Restart
ssh root@<VPS_IP> 'systemctl restart livekit-docker'
```

---

## Project Structure

```
livekit/
├── agent.py              # Voice agent (STT + LLM + TTS pipeline)
├── pyproject.toml         # Python project config
├── uv.lock               # Locked dependencies
├── .env.local             # API keys (not committed)
├── Dockerfile             # Agent container for deployment
├── .dockerignore
├── .gitignore
├── GUIDE.md               # This file
└── scripts/
    ├── setup-dev.sh       # VPS dev setup (no TLS, no auth)
    └── setup-prod.sh      # VPS production setup (TLS + auth)
```
