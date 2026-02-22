"""LiveKit Voice Agent — Groq STT + Gemini LLM + Fish Audio TTS."""

from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentServer, AgentSession, Agent, room_io
from livekit.plugins import silero, groq, google, fishaudio
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv(".env.local")


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
                "or other symbols."
            ),
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
            # reference_id="YOUR_CUSTOM_VOICE_ID",  # uncomment & set your Fish Audio voice ID
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
