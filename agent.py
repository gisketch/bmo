"""LiveKit Voice Agent — Groq STT + Gemini LLM + Fish Audio TTS."""

from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentServer, AgentSession, Agent, room_io, function_tool, RunContext
from livekit.plugins import silero, groq, google, fishaudio
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv(".env.local")

PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "bmo.json"

# GMT+8 timezone
GMT_PLUS_8 = timezone(timedelta(hours=8))


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


@server.rtc_session(agent_name="voice-agent")
async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        # ── STT: Groq Whisper ──
        stt=groq.STT(
            model="whisper-large-v3-turbo",
            language="en",
        ),
        # ── LLM: Google Gemini 3 Flash ──
        llm=google.LLM(
            model="gemini-3-flash-preview",
        ),
        # ── TTS: Fish Audio (custom voice) ──
        # Set FISH_VOICE_REFERENCE_ID in .env.local to your custom voice ID
        tts=fishaudio.TTS(
            model="s1",
            reference_id="323847d4c5394c678e5909c2206725f6",  # uncomment & set your Fish Audio voice ID
        ),
        # ── VAD + Turn Detection (local models, no API key) ──
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
    )

    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
