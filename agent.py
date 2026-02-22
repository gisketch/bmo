"""LiveKit Voice Agent — Groq STT + Gemini LLM + Fish Audio TTS."""

from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentServer, AgentSession, Agent, room_io, function_tool, RunContext
from livekit.plugins import silero, groq, google, fishaudio
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv(".env.local")

# GMT+8 timezone
GMT_PLUS_8 = timezone(timedelta(hours=8))


class Assistant(Agent):
    """Voice assistant powered by Gemini with Groq transcription and Fish Audio voice."""

    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are a helpful voice AI assistant. "
                "You eagerly assist users with their questions by providing "
                "information from your extensive knowledge. "
                "Your responses are concise, to the point, and without any "
                "complex formatting or punctuation including emojis, asterisks, "
                "or other symbols. "
                "You have access to tools. When the user asks for the current time, "
                "always use the get_current_time tool."
            ),
        )

    @function_tool()
    async def get_current_time(self, context: RunContext) -> str:
        """Get the current date and time in GMT+8 timezone.

        Returns the current date, time, and day of the week.
        Use this whenever the user asks what time it is, what day it is,
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
