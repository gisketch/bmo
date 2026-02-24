import asyncio
import json
from datetime import datetime

from livekit.agents import Agent, function_tool, RunContext
from livekit.agents.llm import ChatContext, ChatMessage

from bmo.config import PROMPT_PATH, GMT_PLUS_8, MEM0_SETTING, mem0_client, logger
from bmo.memory_policy import durable_categories, gatekeep_durable_memories, should_run_retrieval
from bmo.prompt import load_prompt, compose_instructions
from bmo.services import fetch_obsidian_search


class Assistant(Agent):

    def __init__(self) -> None:
        prompt = load_prompt(PROMPT_PATH)
        instructions = compose_instructions(prompt)
        super().__init__(instructions=instructions)
        self._mem0_profile_injected = False

    async def on_enter(self) -> None:
        if mem0_client is None or MEM0_SETTING != "GATED":
            return

        try:
            await self._inject_profile_into_chat_ctx()
        except Exception as e:
            logger.warning(f"Failed to run on-enter Mem0 profile injection: {e}")

    def _inject_memories(self, turn_ctx: ChatContext, paragraphs: list[str], *, title: str) -> None:
        cleaned = [p.strip() for p in paragraphs if isinstance(p, str) and p.strip()]
        if not cleaned:
            return
        full_context = f"{title}:\n" + "\n".join(f"- {p}" for p in cleaned)
        logger.info(f"Injecting RAG context: {full_context}")
        turn_ctx.add_message(role="system", content=full_context)

    def _extract_paragraphs(self, search_results: object, *, filter_durable: bool) -> list[str]:
        if not search_results:
            return []

        results_list = search_results.get("results", []) if isinstance(search_results, dict) else search_results
        if not isinstance(results_list, list):
            return []

        paragraphs: list[str] = []
        allowed = set(durable_categories())
        for result in results_list:
            if not isinstance(result, dict):
                continue

            category = None
            if isinstance(result.get("metadata"), dict):
                category = result["metadata"].get("category")
            if category is None:
                category = result.get("category")

            if filter_durable:
                if not isinstance(category, str) or category not in allowed:
                    continue

            paragraph = result.get("memory") or result.get("text")
            if isinstance(paragraph, str) and paragraph.strip():
                paragraphs.append(paragraph.strip())

        return paragraphs

    def _durable_filters(self) -> dict:
        return {"category": {"in": list(durable_categories())}}

    async def _search_mem0(self, query: str, *, limit: int) -> object:
        def _search_with_filters():
            return mem0_client.search(
                query,
                user_id="glenn",
                limit=limit,
                filters=self._durable_filters(),
                threshold=0.65,
            )

        def _search_without_filters():
            return mem0_client.search(query, user_id="glenn", limit=limit, threshold=0.65)

        try:
            return await asyncio.to_thread(_search_with_filters)
        except TypeError:
            return await asyncio.to_thread(_search_without_filters)
        except Exception:
            return await asyncio.to_thread(_search_without_filters)

    async def _inject_profile_into_chat_ctx(self) -> None:
        if self._mem0_profile_injected:
            return
        try:
            search_results = await self._search_mem0(
                "User profile: relationships, preferences, goals, personal facts",
                limit=12,
            )
            paragraphs = self._extract_paragraphs(search_results, filter_durable=True)
            if paragraphs:
                ctx = self.chat_ctx
                self._inject_memories(ctx, paragraphs, title="Mem0 Profile (durable context only)")
                await self.update_chat_ctx(ctx)
            self._mem0_profile_injected = True
        except Exception as e:
            logger.warning(f"Failed to inject Mem0 profile: {e}")

    async def _inject_profile_once(self, turn_ctx: ChatContext) -> None:
        if self._mem0_profile_injected:
            return
        await self._inject_profile_into_chat_ctx()

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        if mem0_client is not None and new_message.text_content:
            mode = MEM0_SETTING
            user_text = new_message.text_content

            if mode == "NORMAL":
                def _add_memory_normal():
                    try:
                        mem0_client.add(
                            [{"role": "user", "content": user_text}],
                            user_id="glenn",
                        )
                    except Exception as e:
                        logger.warning(f"Failed to store user message in Mem0: {e}")

                asyncio.create_task(asyncio.to_thread(_add_memory_normal))

                try:
                    search_results = await asyncio.to_thread(
                        mem0_client.search,
                        user_text,
                        user_id="glenn",
                    )
                    paragraphs = self._extract_paragraphs(search_results, filter_durable=False)
                    self._inject_memories(turn_ctx, paragraphs, title="Mem0 Memories")
                except Exception as e:
                    logger.warning(f"Failed to inject RAG context from Mem0: {e}")

            else:
                decision = gatekeep_durable_memories(user_text)
                if decision.should_store:
                    def _add_memory_gated():
                        try:
                            for item in decision.items:
                                mem0_client.add(
                                    [{"role": "user", "content": item.text}],
                                    user_id="glenn",
                                    metadata={"category": item.category.value, "mode": "gated"},
                                    infer=False,
                                )
                        except Exception as e:
                            logger.warning(f"Failed to store gated memories in Mem0: {e}")

                    asyncio.create_task(asyncio.to_thread(_add_memory_gated))

                try:
                    await self._inject_profile_once(turn_ctx)

                    if should_run_retrieval(user_text):
                        search_results = await self._search_mem0(user_text, limit=8)
                        paragraphs = self._extract_paragraphs(search_results, filter_durable=True)
                        self._inject_memories(turn_ctx, paragraphs, title="Mem0 Memories (durable context only)")
                except Exception as e:
                    logger.warning(f"Failed to inject gated RAG context from Mem0: {e}")

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
