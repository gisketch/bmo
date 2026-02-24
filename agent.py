"""BMO Voice Agent -- Persistent LiveKit agent with Deepgram STT + Gemini LLM + Fish Audio TTS."""

import asyncio
import threading

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, JobProcess, room_io
from livekit.plugins import silero, deepgram, google, fishaudio
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from bmo.config import AGENT_NAME, logger
from bmo.status import increment_llm_counter, build_status_response
from bmo.assistant import Assistant
from bmo.room import ensure_room_and_dispatch, agent_watchdog

server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

server.setup_fnc = prewarm


def _create_session(ctx):
    return AgentSession(
        stt=deepgram.STT(model="nova-3", language="en"),
        llm=google.LLM(model="gemini-3-flash-preview"),
        tts=fishaudio.TTS(model="s1", reference_id="323847d4c5394c678e5909c2206725f6"),
        vad=ctx.proc.userdata["vad"],
        turn_detection=MultilingualModel(),
    )


@server.rtc_session(agent_name=AGENT_NAME)
async def entrypoint(ctx: agents.JobContext):
    session = _create_session(ctx)

    @session.on("agent_state_changed")
    def _on_agent_state_changed(*args, **kwargs):
        if args and hasattr(args[0], 'new_state') and args[0].new_state == 'speaking':
            increment_llm_counter()

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_options=room_io.RoomOptions(
            close_on_disconnect=False,
            delete_room_on_close=False,
        ),
    )

    @ctx.room.local_participant.register_rpc_method("getStatus")
    async def handle_get_status(data: rtc.RpcInvocationData) -> str:
        return await build_status_response()

    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")
    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )

    while True:
        try:
            disconnect_event = asyncio.Event()

            def on_participant_disconnected(p):
                if p.identity == participant.identity:
                    disconnect_event.set()

            ctx.room.on("participant_disconnected", on_participant_disconnected)
            await disconnect_event.wait()
            ctx.room.off("participant_disconnected", on_participant_disconnected)
            logger.info(f"Participant disconnected: {participant.identity}")

            participant = await ctx.wait_for_participant()
            logger.info(f"Participant re-joined: {participant.identity}")

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
                logger.info("Room connection lost. Re-dispatching agent...")
                try:
                    await ensure_room_and_dispatch()
                except Exception as dispatch_err:
                    logger.warning(f"Re-dispatch failed: {dispatch_err}")
                break
            await asyncio.sleep(2)


if __name__ == "__main__":
    threading.Thread(target=agent_watchdog, daemon=True).start()
    agents.cli.run_app(server)
