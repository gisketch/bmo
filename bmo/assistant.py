import asyncio
import json
from datetime import datetime

from livekit.agents import Agent, function_tool, RunContext
from livekit.agents.llm import ChatContext, ChatMessage

from bmo.config import PROMPT_PATH, GMT_PLUS_8, mem0_client, logger
from bmo.prompt import load_prompt, compose_instructions
from bmo.services import fetch_obsidian_search


class Assistant(Agent):

    def __init__(self) -> None:
        prompt = load_prompt(PROMPT_PATH)
        instructions = compose_instructions(prompt)
        super().__init__(instructions=instructions)

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        if mem0_client is not None and new_message.text_content:
            def _add_memory():
                try:
                    mem0_client.add(
                        [{"role": "user", "content": new_message.text_content}],
                        user_id="glenn"
                    )
                except Exception as e:
                    logger.warning(f"Failed to store user message in Mem0: {e}")

            asyncio.create_task(asyncio.to_thread(_add_memory))

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
                        turn_ctx.add_message(role="system", content=full_context)
            except Exception as e:
                logger.warning(f"Failed to inject RAG context from Mem0: {e}")

        await super().on_user_turn_completed(turn_ctx, new_message)

    @function_tool()
    async def get_current_time(self, context: RunContext) -> str:
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
            "Input: a free-text search query and a short BMO-style loading_message describing what you're searching for. "
            "Output: JSON with a top-level 'results' array."
        ),
    )
    async def obsidian_query(self, context: RunContext, query: str, loading_message: str) -> str:
        try:
            room = context.session.room_io.room
            payload = json.dumps({"type": "loading-status", "text": loading_message})
            await room.local_participant.publish_data(payload, topic="loading-status")
        except Exception as e:
            logger.warning(f"Failed to send loading status: {e}")

        return await fetch_obsidian_search(query)

    @function_tool(
        name="present_to_cassette",
        description=(
            "Present physical text to the user through BMO's cassette slot. "
            "Use for precise data like ID numbers, credentials, codes, or any info "
            "the user would want to read rather than just hear."
        ),
    )
    async def present_to_cassette(self, context: RunContext, title: str, content: str) -> str:
        try:
            room = context.session.room_io.room
            payload = json.dumps({"type": "cassette", "title": title, "content": content})
            await room.local_participant.publish_data(payload, topic="cassette")
            return f"Cassette sent: '{title}' delivered to screen."
        except Exception as e:
            logger.warning(f"Failed to send cassette message: {e}")
            return "Could not send cassette message — screen unavailable."
