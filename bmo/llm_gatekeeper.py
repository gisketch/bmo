from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Literal

from google import genai

from bmo.memory_policy import MemoryCategory


@dataclass(frozen=True)
class GatekeeperAction:
    op: str
    text: str
    category: MemoryCategory
    memory_id: str | None = None


@dataclass(frozen=True)
class GatekeeperResult:
    actions: tuple[GatekeeperAction, ...]
    reason: str
    status: Literal["store", "skip", "error"]

    @property
    def should_store(self) -> bool:
        return bool(self.actions)


def run_llm_gatekeeper(
    *,
    user_text: str,
    existing_memories: list[dict],
    model: str = "gemini-3-flash-preview",
) -> GatekeeperResult:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return GatekeeperResult(actions=(), reason="missing_google_api_key", status="error")

    memories_compact: list[dict] = []
    for m in existing_memories:
        if not isinstance(m, dict):
            continue
        mid = m.get("id")
        mem = m.get("memory")
        md = m.get("metadata") if isinstance(m.get("metadata"), dict) else {}
        cat = md.get("category")
        if isinstance(mid, str) and isinstance(mem, str) and mem.strip():
            memories_compact.append({"id": mid, "memory": mem.strip(), "category": cat})

    system = (
        "You are a memory gatekeeper for a voice assistant. "
        "Your job is to decide what durable long-term memories should be stored. "
        "Only store stable facts and preferences that will matter later. "
        "Do NOT store transient status updates, bodily functions, tool requests, one-off actions."
        "Prefer atomic, canonical statements."
    )

    categories = [c.value for c in MemoryCategory]

    user = {
        "user_text": user_text,
        "preferred_memory_types": {
            "allowed_categories": categories,
            "examples_store": [
                {"category": "relationships", "text": "Has a brother named Elp."},
                {"category": "preferences", "text": "Favorite color: blue."},
                {"category": "goals", "text": "Goal: become a better backend engineer."},
                {"category": "personal_facts", "text": "Works as a software engineer."},
            ],
            "examples_skip": [
                "I'm pooping.",
                "Pick a random cassette.",
                "I'm hungry right now.",
                "Turn the volume up.",
            ],
        },
        "existing_memories": memories_compact,
        "output_schema": {
            "store": "boolean",
            "reason": "string",
            "actions": [
                {
                    "op": "add|update",
                    "memory_id": "string (required if op=update)",
                    "category": "one of allowed_categories",
                    "text": "canonical memory text",
                }
            ],
        },
        "rules": [
            "Return ONLY valid JSON. No markdown, no code fences.",
            "If nothing durable, return store=false and actions=[]",
            "Use op=update only if an existing memory already expresses the same fact (choose the best matching id).",
            "If you update, output the full corrected canonical memory text.",
            "Keep text short (<= 100 chars) and avoid sensitive details.",
        ],
    }

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=[
            {"role": "system", "parts": [{"text": system}]},
            {"role": "user", "parts": [{"text": json.dumps(user, ensure_ascii=False)}]},
        ],
        config={
            "temperature": 0.2,
            "response_mime_type": "application/json",
        },
    )

    raw_text = _extract_text(response)
    payload = _parse_json(raw_text)

    if not isinstance(payload, dict):
        return GatekeeperResult(actions=(), reason="invalid_json", status="error")

    store = bool(payload.get("store"))
    actions_raw = payload.get("actions")
    if store and (not isinstance(actions_raw, list) or not actions_raw):
        return GatekeeperResult(actions=(), reason="store_true_no_actions", status="error")

    if not store:
        reason = payload.get("reason")
        return GatekeeperResult(actions=(), reason=str(reason) if reason else "skip", status="skip")

    actions: list[GatekeeperAction] = []
    for action in actions_raw:
        if not isinstance(action, dict):
            continue
        op = str(action.get("op") or "").strip().lower()
        text = action.get("text")
        category = action.get("category")
        memory_id = action.get("memory_id")

        if op not in {"add", "update"}:
            continue
        if not isinstance(text, str) or not text.strip():
            continue
        if not isinstance(category, str) or category not in categories:
            continue
        if op == "update" and not (isinstance(memory_id, str) and memory_id.strip()):
            continue

        actions.append(
            GatekeeperAction(
                op=op,
                text=text.strip(),
                category=MemoryCategory(category),
                memory_id=memory_id.strip() if isinstance(memory_id, str) else None,
            )
        )

    reason = payload.get("reason")
    if not actions:
        return GatekeeperResult(actions=(), reason="no_valid_actions", status="error")

    return GatekeeperResult(actions=tuple(actions), reason=str(reason) if reason else "store", status="store")


def _extract_text(response) -> str:
    try:
        parts = getattr(response, "parts", None)
        if isinstance(parts, list) and parts:
            texts: list[str] = []
            for p in parts:
                if isinstance(p, dict) and isinstance(p.get("text"), str):
                    texts.append(p["text"])
                else:
                    t = getattr(p, "text", None)
                    if isinstance(t, str):
                        texts.append(t)
            if texts:
                return "\n".join(texts)
    except Exception:
        pass

    text = getattr(response, "text", None)
    if isinstance(text, str):
        return text

    return str(response)


def _parse_json(text: str):
    cleaned = (text or "").strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(cleaned[start : end + 1])
        except Exception:
            return None

    return None
