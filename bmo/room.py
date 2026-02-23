import asyncio
import time

from livekit import api

from bmo.config import ROOM_NAME, AGENT_NAME, WATCHDOG_INTERVAL, logger


async def ensure_room_and_dispatch():
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


def agent_watchdog():
    time.sleep(20)
    logger.info("Agent watchdog started")
    while True:
        try:
            asyncio.run(ensure_room_and_dispatch())
        except Exception as e:
            logger.warning(f"Watchdog error: {e}")
        time.sleep(WATCHDOG_INTERVAL)
