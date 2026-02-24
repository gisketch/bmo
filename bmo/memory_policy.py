from __future__ import annotations

import re
from dataclasses import dataclass
from enum import StrEnum


class MemoryCategory(StrEnum):
    RELATIONSHIPS = "relationships"
    PREFERENCES = "preferences"
    GOALS = "goals"
    PERSONAL_FACTS = "personal_facts"


_DURABLE_CATEGORIES: tuple[MemoryCategory, ...] = (
    MemoryCategory.RELATIONSHIPS,
    MemoryCategory.PREFERENCES,
    MemoryCategory.GOALS,
    MemoryCategory.PERSONAL_FACTS,
)


@dataclass(frozen=True)
class MemoryItem:
    text: str
    category: MemoryCategory


@dataclass(frozen=True)
class MemoryDecision:
    items: tuple[MemoryItem, ...]
    reason: str

    @property
    def should_store(self) -> bool:
        return bool(self.items)


_RELATIONSHIP_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(
        r"\bmy\s+(brother|sister|mom|mother|dad|father|partner|wife|husband|girlfriend|boyfriend)\s+(?:is|named|called)\s+([A-Za-z][A-Za-z0-9_\-']{1,40})\b",
        re.IGNORECASE,
    ),
)

_PREFERENCE_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bI\s+(love|like|enjoy)\s+(.+)$", re.IGNORECASE),
    re.compile(r"\bI\s+(hate|dislike)\s+(.+)$", re.IGNORECASE),
    re.compile(r"\bI\s+prefer\s+(.+)$", re.IGNORECASE),
    re.compile(r"\bmy\s+favorite\s+([^\n]{1,40})\s+is\s+(.+)$", re.IGNORECASE),
)

_GOAL_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bmy\s+goal\s+is\s+(.+)$", re.IGNORECASE),
    re.compile(r"\bI\s+want\s+to\s+(.+)$", re.IGNORECASE),
    re.compile(r"\bI\s+am\s+trying\s+to\s+(.+)$", re.IGNORECASE),
    re.compile(r"\bremember\s+to\s+(.+)$", re.IGNORECASE),
)

_PERSONAL_FACT_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bmy\s+name\s+is\s+([A-Za-z][A-Za-z0-9_\-']{1,40})\b", re.IGNORECASE),
    re.compile(r"\bI\s+live\s+in\s+([^\n]{2,60})$", re.IGNORECASE),
    re.compile(r"\bI\s+am\s+from\s+([^\n]{2,60})$", re.IGNORECASE),
    re.compile(r"\bI\s+work\s+as\s+([^\n]{2,60})$", re.IGNORECASE),
)


def durable_categories() -> tuple[str, ...]:
    return tuple(c.value for c in _DURABLE_CATEGORIES)


def should_run_retrieval(message: str) -> bool:
    text = _normalize(message)
    if not text:
        return False

    explicit = (
        "do you remember" in text
        or text.startswith("remember")
        or "what do you know about me" in text
        or "what do you remember" in text
    )
    if explicit:
        return True

    if "my " in text and "?" in text:
        return True

    if any(kw in text for kw in ("preference", "preferences", "favorite", "favourite", "brother", "sister")):
        return True

    return False


def gatekeep_durable_memories(message: str) -> MemoryDecision:
    original = (message or "").strip()
    if not original:
        return MemoryDecision(items=(), reason="empty")

    items: list[MemoryItem] = []

    text = _strip_trailing_punct(original)
    chunks = [c.strip() for c in re.split(r"[.!?]+", text) if c.strip()]
    if not chunks:
        chunks = [text]

    for chunk in chunks:
        items.extend(_extract_relationships(chunk))
        items.extend(_extract_preferences(chunk))
        items.extend(_extract_goals(chunk))
        items.extend(_extract_personal_facts(chunk))

    deduped = _dedupe(items)
    if not deduped:
        return MemoryDecision(items=(), reason="no_durable_match")

    return MemoryDecision(items=tuple(deduped), reason="durable_match")


def _extract_relationships(text: str) -> list[MemoryItem]:
    out: list[MemoryItem] = []
    for pattern in _RELATIONSHIP_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue

        relation = match.group(1).lower()
        name = _titlecase_name(match.group(2))
        if relation in {"mom", "mother"}:
            out.append(MemoryItem(text=f"Has a mother named {name}.", category=MemoryCategory.RELATIONSHIPS))
        elif relation in {"dad", "father"}:
            out.append(MemoryItem(text=f"Has a father named {name}.", category=MemoryCategory.RELATIONSHIPS))
        else:
            out.append(MemoryItem(text=f"Has a {relation} named {name}.", category=MemoryCategory.RELATIONSHIPS))

    return out


def _extract_preferences(text: str) -> list[MemoryItem]:
    out: list[MemoryItem] = []
    for pattern in _PREFERENCE_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue

        if match.re.pattern.startswith("\\bmy\\s+favorite"):
            thing = _compact(match.group(1))
            value = _compact(match.group(2))
            if thing and value:
                out.append(
                    MemoryItem(
                        text=f"Favorite {thing}: {value}.",
                        category=MemoryCategory.PREFERENCES,
                    )
                )
            continue

        verb = match.group(1).lower() if match.lastindex and match.lastindex >= 2 else ""
        tail = match.group(2) if match.lastindex and match.lastindex >= 2 else match.group(1)
        tail = _compact(tail)
        if not tail:
            continue

        if verb in {"hate", "dislike"}:
            out.append(MemoryItem(text=f"Dislikes {tail}.", category=MemoryCategory.PREFERENCES))
        elif verb in {"love", "like", "enjoy"}:
            out.append(MemoryItem(text=f"Likes {tail}.", category=MemoryCategory.PREFERENCES))
        else:
            out.append(MemoryItem(text=f"Prefers {tail}.", category=MemoryCategory.PREFERENCES))

    return out


def _extract_goals(text: str) -> list[MemoryItem]:
    out: list[MemoryItem] = []
    for pattern in _GOAL_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue

        goal = _compact(match.group(1))
        if goal:
            out.append(MemoryItem(text=f"Goal: {goal}.", category=MemoryCategory.GOALS))

    return out


def _extract_personal_facts(text: str) -> list[MemoryItem]:
    out: list[MemoryItem] = []

    name_pattern, live_pattern, from_pattern, work_pattern = _PERSONAL_FACT_PATTERNS

    for pattern in _PERSONAL_FACT_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue

        if pattern is name_pattern:
            name = _titlecase_name(match.group(1))
            out.append(MemoryItem(text=f"Name is {name}.", category=MemoryCategory.PERSONAL_FACTS))
            continue

        fact = _compact(match.group(1))
        if not fact:
            continue

        if pattern is live_pattern:
            out.append(MemoryItem(text=f"Lives in {fact}.", category=MemoryCategory.PERSONAL_FACTS))
        elif pattern is from_pattern:
            out.append(MemoryItem(text=f"From {fact}.", category=MemoryCategory.PERSONAL_FACTS))
        else:
            out.append(MemoryItem(text=f"Works as {fact}.", category=MemoryCategory.PERSONAL_FACTS))

    return out


def _dedupe(items: list[MemoryItem]) -> list[MemoryItem]:
    seen: set[tuple[str, MemoryCategory]] = set()
    out: list[MemoryItem] = []
    for item in items:
        key = (item.text.strip(), item.category)
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def _normalize(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _strip_trailing_punct(text: str) -> str:
    return text.strip().rstrip(".!?")


def _compact(text: str) -> str:
    value = " ".join((text or "").strip().split())
    value = value.strip(" \t\n\r\"'“”‘’")
    if not value:
        return ""
    if len(value) > 120:
        value = value[:117].rstrip() + "..."
    return value


def _titlecase_name(name: str) -> str:
    cleaned = _compact(name)
    if not cleaned:
        return cleaned
    return cleaned[:1].upper() + cleaned[1:]
