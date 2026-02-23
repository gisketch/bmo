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
from livekit.plugins import silero, deepgram, groq, google, fishaudio
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv(".env.local")

logger = logging.getLogger("bmo-agent")

ROOM_NAME = "bmo-room"
AGENT_NAME = "voice-agent"

PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "bmo.json"

# GMT+8 timezone
GMT_PLUS_8 = timezone(timedelta(hours=8))


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
            # Resolve project_id if not cached
            if _deepgram_project_id is None:
                resp = await client.get(
                    "https://api.deepgram.com/v1/projects",
                    headers=headers,
                )
                resp.raise_for_status()
                projects = resp.json().get("projects", [])
                if not projects:
                    return None
                _deepgram_project_id = projects[0]["project_id"]

            # Fetch balances
            resp = await client.get(
                f"https://api.deepgram.com/v1/projects/{_deepgram_project_id}/balances",
                headers=headers,
            )
            resp.raise_for_status()
            balances = resp.json().get("balances", [])
            if not balances:
                return None
            return float(balances[0].get("amount", 0))
    except Exception as e:
        logger.warning(f"DeepGram balance fetch failed: {e}")
        return None


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

    # ── Register RPC methods ──
    @ctx.room.local_participant.register_rpc_method("getStatus")
    async def handle_get_status(data: rtc.RpcInvocationData) -> str:
        """Return current service status as JSON."""
        return await _build_status_response()

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
    """Create the persistent room and dispatch the agent to it, retrying until success."""
    lk = api.LiveKitAPI()
    try:
        # Create room with infinite lifetime
        await lk.room.create_room(
            api.CreateRoomRequest(
                name=ROOM_NAME,
                empty_timeout=0,
                departure_timeout=0,
            )
        )
        logger.info(f"Room '{ROOM_NAME}' created/verified")

        # Retry dispatch until the agent actually appears in the room
        for attempt in range(20):
            try:
                # Check if agent is already in the room
                resp = await lk.room.list_participants(
                    api.ListParticipantsRequest(room=ROOM_NAME)
                )
                agent_present = any(
                    p.kind == 4  # ParticipantInfo.Kind.AGENT
                    for p in resp.participants
                )
                if agent_present:
                    logger.info(f"Agent already in room '{ROOM_NAME}'")
                    return

                # Dispatch agent
                await lk.agent_dispatch.create_dispatch(
                    api.CreateAgentDispatchRequest(
                        agent_name=AGENT_NAME,
                        room=ROOM_NAME,
                    )
                )
                logger.info(f"Dispatch attempt {attempt + 1}: sent")

                # Wait and check if agent joined
                await asyncio.sleep(5)

            except Exception as e:
                logger.debug(f"Dispatch attempt {attempt + 1} error: {e}")
                await asyncio.sleep(3)

        logger.warning("Agent dispatch: max attempts reached")
    except Exception as e:
        logger.warning(f"Room setup error: {e}")
    finally:
        await lk.aclose()


def _dispatch_after_registration():
    """Background thread: wait for agent to register, then create room + dispatch."""
    import time
    time.sleep(20)  # Give the agent time to register with LiveKit
    logger.info("Attempting room creation and agent dispatch...")
    asyncio.run(ensure_room_and_dispatch())


if __name__ == "__main__":
    import threading
    threading.Thread(target=_dispatch_after_registration, daemon=True).start()
    agents.cli.run_app(server)
