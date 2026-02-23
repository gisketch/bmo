"""LiveKit Voice Agent — Persistent BMO agent with Groq STT + Gemini LLM + Fish Audio TTS."""

import asyncio
import logging
import os
from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
from dotenv import load_dotenv
import httpx

from livekit import agents, api, rtc
from livekit.agents import AgentServer, AgentSession, Agent, JobProcess, room_io, function_tool, RunContext
from livekit.agents.llm import ChatContext, ChatMessage
from livekit.plugins import silero, deepgram, groq, google, fishaudio
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from mem0 import Memory

load_dotenv(".env.local")

logger = logging.getLogger("bmo-agent")

ROOM_NAME = "bmo-room"
AGENT_NAME = "voice-agent"

PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "bmo.json"

# GMT+8 timezone
GMT_PLUS_8 = timezone(timedelta(hours=8))

# ── Mem0 Configuration ─────────────────────────────────────────

MEM0_CONFIG = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "host": "localhost",
            "port": 6333,
        },
    },
    "llm": {
        "provider": "gemini",
        "config": {
            "model": "gemini-3-flash-preview",
        }
    },
    "embedder": {
        "provider": "gemini",
        "config": {
            "model": "models/gemini-embedding-001",
        }
    }
}

try:
    mem0_client = Memory.from_config(MEM0_CONFIG)
    logger.info("Mem0 client initialized successfully.")
except Exception as e:
    logger.warning(f"Failed to initialize Mem0: {e}")
    mem0_client = None

# ── Obsidian RAG service ─────────────────────────────────────

OBSIDIAN_SEARCH_URL_DEFAULT = "http://188.209.141.228:18000/api/v1/search"


# ── Status tracking ────────────────────────────────────────────

_llm_request_count: int = 0
_llm_request_date: str = ""  # YYYY-MM-DD in GMT+8
_deepgram_project_id: str | None = None


def _increment_llm_counter() -> None:
    """Increment LLM request counter, resetting if the day changed."""
    global _llm_request_count, _llm_request_date
    today = datetime.now(GMT_PLUS_8).strftime("%Y-%m-%d")
    if today != _llm_request_date:
        _llm_request_count = 0
        _llm_request_date = today
    _llm_request_count += 1


async def _fetch_fish_audio_balance() -> float | None:
    """Fetch Fish Audio remaining credit balance."""
    api_key = os.environ.get("FISH_API_KEY", "")
    if not api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.fish.audio/wallet/self/api-credit",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            resp.raise_for_status()
            data = resp.json()
            return float(data.get("credit", 0))
    except Exception as e:
        logger.warning(f"Fish Audio balance fetch failed: {e}")
        return None


async def _fetch_deepgram_balance() -> float | None:
    """Fetch DeepGram remaining balance (caches project_id after first lookup)."""
    global _deepgram_project_id
    api_key = os.environ.get("DEEPGRAM_API_KEY", "")
    if not api_key:
        return None
    headers = {"Authorization": f"Token {api_key}"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            project_ids_to_try: list[str] = []
            if isinstance(_deepgram_project_id, str) and _deepgram_project_id:
                project_ids_to_try.append(_deepgram_project_id)

            # Always fetch project list so we can fall back if the cached project
            # doesn't have permission to access billing/balances.
            resp = await client.get(
                "https://api.deepgram.com/v1/projects",
                headers=headers,
            )
            resp.raise_for_status()
            projects = resp.json().get("projects", [])
            for proj in projects:
                pid = proj.get("project_id") if isinstance(proj, dict) else None
                if isinstance(pid, str) and pid and pid not in project_ids_to_try:
                    project_ids_to_try.append(pid)

            for project_id in project_ids_to_try:
                try:
                    bal_resp = await client.get(
                        f"https://api.deepgram.com/v1/projects/{project_id}/balances",
                        headers=headers,
                    )
                    bal_resp.raise_for_status()
                except httpx.HTTPStatusError as status_err:
                    # If a key can list projects but cannot read balances for a
                    # specific project, Deepgram returns 403.
                    if status_err.response is not None and status_err.response.status_code == 403:
                        continue
                    raise

                balances = bal_resp.json().get("balances", [])
                if not balances:
                    _deepgram_project_id = project_id
                    return None

                _deepgram_project_id = project_id
                return float(balances[0].get("amount", 0))

            # No accessible balances across any projects.
            return None
    except Exception as e:
        logger.warning(f"DeepGram balance fetch failed: {e}")
        return None


async def _fetch_obsidian_search(query: str) -> str:
    """Query Ghegi's Obsidian RAG service.

    Returns the raw JSON response as text, or a safe JSON error payload.
    """
    cleaned = query.strip()
    if not cleaned:
        return json.dumps({"results": [], "error": "empty query"})

    url = os.environ.get("OBSIDIAN_SEARCH_URL", OBSIDIAN_SEARCH_URL_DEFAULT)
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(url, params={"query": cleaned})
            resp.raise_for_status()
            try:
                payload = resp.json()
            except Exception:
                return json.dumps({"results": [], "error": "invalid json from obsidian service"})

            if not isinstance(payload, dict):
                return json.dumps({"results": [], "error": "unexpected response from obsidian service"})

            results = payload.get("results")
            if not isinstance(results, list):
                return json.dumps({"results": [], "error": "missing results from obsidian service"})

            normalized_results: list[dict] = []
            for item in results:
                if isinstance(item, dict):
                    normalized_item = dict(item)
                    normalized_item.setdefault("source_path", None)
                    normalized_item.setdefault("text", None)
                    normalized_item.setdefault("score", None)
                else:
                    normalized_item = {
                        "source_path": None,
                        "text": None if item is None else str(item),
                        "score": None,
                    }
                normalized_results.append(normalized_item)

            payload["results"] = normalized_results
            return json.dumps(payload)
    except Exception as e:
        logger.warning(f"Obsidian query failed: {type(e).__name__}")
        return json.dumps({"results": [], "error": "obsidian query failed"})


async def _build_status_response() -> str:
    """Build JSON status response with TTS/STT balances and LLM request count."""
    tts_balance, stt_balance = await asyncio.gather(
        _fetch_fish_audio_balance(),
        _fetch_deepgram_balance(),
    )
    return json.dumps({
        "tts_balance": tts_balance,
        "stt_balance": stt_balance,
        "llm_requests_today": _llm_request_count,
    })


class Assistant(Agent):
    """Voice assistant powered by Gemini with Groq transcription and Fish Audio voice."""

    @staticmethod
    def _load_prompt(path: Path) -> dict:
        try:
            raw = path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise RuntimeError(f"Missing prompt JSON at: {path}") from exc

        try:
            prompt = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Invalid JSON in prompt file: {path} ({exc})") from exc

        if not isinstance(prompt, dict):
            raise RuntimeError(f"Prompt JSON must be an object at top-level: {path}")

        return prompt

    @staticmethod
    def _compose_instructions(prompt: dict) -> str:
        persona = prompt.get("persona") if isinstance(prompt.get("persona"), dict) else {}
        audio_control = (
            prompt.get("audio_control") if isinstance(prompt.get("audio_control"), dict) else {}
        )
        tools = prompt.get("tools") if isinstance(prompt.get("tools"), dict) else {}

        lines: list[str] = []

        role = prompt.get("role")
        if isinstance(role, str) and role.strip():
            lines.append(role.strip())

        for section_key, section_label in (
            ("tone", "Tone"),
            ("voice_style", "Voice"),
            ("lore", "Lore"),
        ):
            section = persona.get(section_key)
            if isinstance(section, list) and section:
                lines.append(f"{section_label}:")
                lines.extend(str(item).strip() for item in section if str(item).strip())

        phrases = persona.get("phrases")
        if isinstance(phrases, list) and phrases:
            joined = " ".join(str(p).strip() for p in phrases if str(p).strip())
            if joined:
                lines.append(f"Phrases (use sometimes): {joined}")

        constraints = prompt.get("constraints")
        if isinstance(constraints, list) and constraints:
            lines.append("Constraints:")
            lines.extend(str(item).strip() for item in constraints if str(item).strip())

        if audio_control:
            instruction = audio_control.get("instruction")
            format_rule = audio_control.get("format_rule")
            emotion_tags = audio_control.get("emotion_tags")
            audio_effects = audio_control.get("audio_effects")
            examples = audio_control.get("examples")

            lines.append("Emotion and audio control:")
            if isinstance(instruction, str) and instruction.strip():
                lines.append(instruction.strip())
            if isinstance(format_rule, str) and format_rule.strip():
                lines.append(format_rule.strip())

            if isinstance(emotion_tags, dict) and emotion_tags:
                lines.append("Available emotion tags:")
                for group, tags in emotion_tags.items():
                    if isinstance(tags, list) and tags:
                        joined = " ".join(str(t).strip() for t in tags if str(t).strip())
                        if joined:
                            lines.append(f"{group}: {joined}")

            if isinstance(audio_effects, list) and audio_effects:
                joined = " ".join(str(e).strip() for e in audio_effects if str(e).strip())
                if joined:
                    lines.append(f"Available audio effects: {joined}")

            if isinstance(examples, list) and examples:
                lines.append("Examples:")
                lines.extend(str(ex).strip() for ex in examples if str(ex).strip())

        tool_rules = tools.get("rules")
        if isinstance(tool_rules, list) and tool_rules:
            lines.append("Tools:")
            lines.append("You have access to tools.")
            lines.extend(str(item).strip() for item in tool_rules if str(item).strip())

        tool_descriptions = tools.get("descriptions")
        if isinstance(tool_descriptions, dict) and tool_descriptions:
            lines.append("Tool hints:")
            for tool_name, description in tool_descriptions.items():
                if str(tool_name).strip() and str(description).strip():
                    lines.append(f"{str(tool_name).strip()}: {str(description).strip()}")

        return "\n".join(lines).strip()

    def __init__(self) -> None:
        prompt = self._load_prompt(PROMPT_PATH)
        instructions = self._compose_instructions(prompt)
        super().__init__(instructions=instructions)

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        if mem0_client is not None and new_message.text_content:
            # 1. Add memory asynchronously (fire and forget)
            def _add_memory():
                try:
                    mem0_client.add(
                        [{"role": "user", "content": new_message.text_content}],
                        user_id="glenn"
                    )
                except Exception as e:
                    logger.warning(f"Failed to store user message in Mem0: {e}")
            
            asyncio.create_task(asyncio.to_thread(_add_memory))
            
            # 2. Search memory and inject context
            try:
                search_results = await asyncio.to_thread(
                    mem0_client.search,
                    new_message.text_content,
                    user_id="glenn"
                )
                
                if search_results:
                    results_list = search_results.get('results', []) if isinstance(search_results, dict) else search_results
                    
                    context_parts = []
                    for result in results_list:
                        if isinstance(result, dict):
                            paragraph = result.get("memory") or result.get("text")
                            if paragraph:
                                context_parts.append(f"- {paragraph}")
                    
                    if context_parts:
                        full_context = "Mem0 Memories:\n" + "\n".join(context_parts)
                        logger.info(f"Injecting RAG context: {full_context}")
                        turn_ctx.add_message(role="assistant", content=full_context)
            except Exception as e:
                logger.warning(f"Failed to inject RAG context from Mem0: {e}")

        await super().on_user_turn_completed(turn_ctx, new_message)

    @function_tool()
    async def get_current_time(self, context: RunContext) -> str:
        """Check BMO's clock circuits and return the current date/time (GMT+8).

        Use this whenever the user asks what time it is, what day it is, what date it is,
        or anything related to the current date or time.
        """
        now = datetime.now(GMT_PLUS_8)
        return (
            f"Current time (GMT+8): {now.strftime('%I:%M %p')}, "
            f"{now.strftime('%A, %B %d, %Y')}"
        )

    @function_tool(
        name="obsidian-query",
        description=(
            "Search Ghegi's Obsidian notes via RAG. Use when Ghegi is mentioned or when asked "
            "for Ghegi-specific info likely stored in notes (e.g., Philhealth/SSS numbers, VPS credentials). "
            "Input: a free-text search query. Output: JSON with a top-level 'results' array."
        ),
    )
    async def obsidian_query(self, context: RunContext, query: str) -> str:
        """Search Ghegi's Obsidian notes (RAG) and return the raw JSON results."""
        return await _fetch_obsidian_search(query)


server = AgentServer()


def prewarm(proc: JobProcess):
    """Pre-load VAD model to avoid cold start."""
    proc.userdata["vad"] = silero.VAD.load()

server.setup_fnc = prewarm


@server.rtc_session(agent_name=AGENT_NAME)
async def entrypoint(ctx: agents.JobContext):

    def _create_session(ctx):
        """Create a fresh AgentSession with all pipeline components."""
        return AgentSession(
            # ── STT: Deepgram Nova ──
            stt=deepgram.STT(
                model="nova-3",
                language="en",
            ),
            # ── STT (alt): Groq Whisper — geo-blocked in HK ──
            # stt=groq.STT(
            #     model="whisper-large-v3-turbo",
            #     language="en",
            # ),
            # ── LLM: Google Gemini 3 Flash ──
            llm=google.LLM(
                model="gemini-3-flash-preview",
            ),
            # ── TTS: Fish Audio (custom voice) ──
            tts=fishaudio.TTS(
                model="s1",
                reference_id="323847d4c5394c678e5909c2206725f6",
            ),
            # ── VAD (pre-loaded) + Turn Detection (needs job context) ──
            vad=ctx.proc.userdata["vad"],
            turn_detection=MultilingualModel(),
        )

    session = _create_session(ctx)

    # Track LLM usage via session events
    @session.on("agent_state_changed")
    def _on_agent_state_changed(*args, **kwargs):
        # Increment when agent transitions to speaking (implies LLM completed)
        if args and hasattr(args[0], 'new_state') and args[0].new_state == 'speaking':
            _increment_llm_counter()

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_options=room_io.RoomOptions(
            close_on_disconnect=False,
            delete_room_on_close=False,
        ),
    )

    # ── Register RPC methods (must be after session.start connects to room) ──
    @ctx.room.local_participant.register_rpc_method("getStatus")
    async def handle_get_status(data: rtc.RpcInvocationData) -> str:
        """Return current service status as JSON."""
        return await _build_status_response()

    # Greet the first participant
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")
    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )

    # Stay alive indefinitely — detect disconnect, then wait for reconnect
    while True:
        try:
            # Wait for the current participant to disconnect
            disconnect_event = asyncio.Event()

            def on_participant_disconnected(p):
                if p.identity == participant.identity:
                    disconnect_event.set()

            ctx.room.on("participant_disconnected", on_participant_disconnected)
            await disconnect_event.wait()
            ctx.room.off("participant_disconnected", on_participant_disconnected)
            logger.info(f"Participant disconnected: {participant.identity}")

            # Wait for a new participant to join
            participant = await ctx.wait_for_participant()
            logger.info(f"Participant re-joined: {participant.identity}")

            # Try to reuse existing session; if it crashed, create a fresh one
            try:
                session.room_io.set_participant(participant)
            except Exception:
                logger.info("Previous session died, creating new AgentSession")
                session = _create_session(ctx)
                await session.start(
                    room=ctx.room,
                    agent=Assistant(),
                    room_options=room_io.RoomOptions(
                        close_on_disconnect=False,
                        delete_room_on_close=False,
                    ),
                )

            await session.generate_reply(
                instructions="Greet the user. They just reconnected. Welcome them back warmly. Mention Ghegi but use <|phoneme_start|>G EH G IY<|phoneme_end|>"
            )
        except Exception as e:
            err_msg = str(e).lower()
            logger.warning(f"Error in participant lifecycle: {e}")
            if "disconnected" in err_msg or "closed" in err_msg:
                # Room connection lost — re-dispatch a fresh agent and exit this job
                logger.info("Room connection lost. Re-dispatching agent...")
                try:
                    await ensure_room_and_dispatch()
                except Exception as dispatch_err:
                    logger.warning(f"Re-dispatch failed: {dispatch_err}")
                break
            await asyncio.sleep(2)


async def ensure_room_and_dispatch():
    """Create the persistent room and dispatch the agent if none is present."""
    lk = api.LiveKitAPI()
    try:
        await lk.room.create_room(
            api.CreateRoomRequest(
                name=ROOM_NAME,
                empty_timeout=0,
                departure_timeout=0,
            )
        )

        resp = await lk.room.list_participants(
            api.ListParticipantsRequest(room=ROOM_NAME)
        )
        agent_present = any(
            p.kind == 4  # ParticipantInfo.Kind.AGENT
            for p in resp.participants
        )
        if agent_present:
            return

        logger.info("No agent in room — dispatching...")
        await lk.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name=AGENT_NAME,
                room=ROOM_NAME,
            )
        )
    except Exception as e:
        logger.warning(f"ensure_room_and_dispatch error: {e}")
    finally:
        await lk.aclose()


WATCHDOG_INTERVAL = 30


def _agent_watchdog():
    """Background thread: periodically ensure an agent is always in the room."""
    import time
    time.sleep(20)
    logger.info("Agent watchdog started")
    while True:
        try:
            asyncio.run(ensure_room_and_dispatch())
        except Exception as e:
            logger.warning(f"Watchdog error: {e}")
        time.sleep(WATCHDOG_INTERVAL)


if __name__ == "__main__":
    import threading
    threading.Thread(target=_agent_watchdog, daemon=True).start()
    agents.cli.run_app(server)
