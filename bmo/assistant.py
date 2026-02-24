import asyncio
import json
from datetime import datetime

from livekit.agents import Agent, function_tool, RunContext
from livekit.agents.llm import ChatContext, ChatMessage

from bmo.config import PROMPT_PATH, GMT_PLUS_8, MEM0_SETTING, mem0_client, logger
from bmo.llm_gatekeeper import run_llm_gatekeeper
from bmo.memory_policy import gatekeep_durable_memories
from bmo.prompt import load_prompt, compose_instructions
from bmo.services import fetch_obsidian_search


class Assistant(Agent):

    def __init__(self) -> None:
        prompt = load_prompt(PROMPT_PATH)
        instructions = compose_instructions(prompt)
        super().__init__(instructions=instructions)
        

    def _inject_memories(self, turn_ctx: ChatContext, paragraphs: list[str], *, title: str) -> None:
        cleaned = [p.strip() for p in paragraphs if isinstance(p, str) and p.strip()]
        if not cleaned:
            return
        full_context = f"{title}:\n" + "\n".join(f"- {p}" for p in cleaned)
        logger.info(f"Injecting RAG context: {full_context}")
        turn_ctx.add_message(role="system", content=full_context)

    def _extract_paragraphs(self, search_results: object) -> list[str]:
        if not search_results:
            return []

        results_list = search_results.get("results", []) if isinstance(search_results, dict) else search_results
        if not isinstance(results_list, list):
            return []

        paragraphs: list[str] = []
        for result in results_list:
            if not isinstance(result, dict):
                continue
            paragraph = result.get("memory") or result.get("text")
            if not isinstance(paragraph, str) or not paragraph.strip():
                continue
            paragraphs.append(paragraph.strip())

        return paragraphs

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

            else:
                def _add_memory_gated_llm():
                    def _heuristic_fallback() -> None:
                        decision = gatekeep_durable_memories(user_text)
                        if not decision.should_store:
                            return
                        for item in decision.items:
                            mem0_client.add(
                                [{"role": "user", "content": item.text}],
                                user_id="glenn",
                                metadata={"category": item.category.value, "mode": "gated", "source": "heuristic"},
                                infer=False,
                            )

                    try:
                        existing = mem0_client.search(user_text, user_id="glenn", limit=25)
                        if isinstance(existing, dict):
                            existing_list = existing.get("results", [])
                        else:
                            existing_list = existing
                        if not isinstance(existing_list, list):
                            existing_list = []

                        result = run_llm_gatekeeper(user_text=user_text, existing_memories=existing_list)
                        if result.status == "error":
                            _heuristic_fallback()
                            return
                        if result.status == "skip":
                            return

                        id_to_has_category: dict[str, bool] = {}
                        for m in existing_list:
                            if not isinstance(m, dict):
                                continue
                            mid = m.get("id")
                            md = m.get("metadata") if isinstance(m.get("metadata"), dict) else {}
                            has_cat = isinstance(md.get("category"), str)
                            if isinstance(mid, str):
                                id_to_has_category[mid] = has_cat

                        for action in result.actions:
                            if action.op == "update" and action.memory_id and id_to_has_category.get(action.memory_id):
                                mem0_client.update(action.memory_id, action.text)
                                continue

                            mem0_client.add(
                                [{"role": "user", "content": action.text}],
                                user_id="glenn",
                                metadata={"category": action.category.value, "mode": "gated", "source": "llm"},
                                infer=False,
                            )
                    except Exception as e:
                        logger.warning(f"Failed to store gated memories in Mem0 (LLM): {e}")
                        try:
                            _heuristic_fallback()
                        except Exception as fallback_err:
                            logger.warning(f"Heuristic fallback failed: {fallback_err}")

                asyncio.create_task(asyncio.to_thread(_add_memory_gated_llm))

            try:
                search_results = await asyncio.to_thread(
                    mem0_client.search,
                    user_text,
                    user_id="glenn",
                )
                paragraphs = self._extract_paragraphs(search_results)
                self._inject_memories(turn_ctx, paragraphs, title="Mem0 Memories")
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
