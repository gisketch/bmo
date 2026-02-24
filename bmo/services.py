import asyncio
import json
import os

import httpx

from bmo.config import OBSIDIAN_SEARCH_URL_DEFAULT, logger


async def fetch_obsidian_search(query: str) -> str:
    """Query Ghegi's Obsidian RAG service. Returns JSON with top-level 'results' array."""
    cleaned = query.strip()
    if not cleaned:
        return json.dumps({"results": [], "error": "empty query"})

    url = os.environ.get("OBSIDIAN_SEARCH_URL", OBSIDIAN_SEARCH_URL_DEFAULT)
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(url, params={"query": cleaned})
            resp.raise_for_status()
            try:
                payload = resp.json()
            except Exception:
                return json.dumps({"results": [], "error": "invalid json from obsidian service"})

            if not isinstance(payload, dict):
                return json.dumps({"results": [], "error": "unexpected response from obsidian service"})

            results = payload.get("results")
            if not isinstance(results, list):
                return json.dumps({"results": [], "error": "missing results from obsidian service"})

            normalized_results: list[dict] = []
            for item in results:
                if isinstance(item, dict):
                    normalized_item = dict(item)
                    normalized_item.setdefault("source_path", None)
                    normalized_item.setdefault("text", None)
                    normalized_item.setdefault("score", None)
                else:
                    normalized_item = {
                        "source_path": None,
                        "text": None if item is None else str(item),
                        "score": None,
                    }
                normalized_results.append(normalized_item)

            payload["results"] = normalized_results
            return json.dumps(payload)
    except Exception as e:
        logger.warning(f"Obsidian query failed: {type(e).__name__}")
        return json.dumps({"results": [], "error": "obsidian query failed"})


_VALID_TOPICS = {"general", "news", "finance"}
_VALID_TIME_RANGES = {"day", "week", "month", "year", "d", "w", "m", "y"}
_RESULT_FIELDS = ("title", "url", "content", "score")


def _run_tavily_search(
    query: str, topic: str, max_results: int, time_range: str | None
) -> dict:
    from tavily import TavilyClient

    api_key = os.environ.get("TAVILY_API_KEY", "")
    if not api_key:
        return {"results": [], "error": "TAVILY_API_KEY not set"}

    client = TavilyClient(api_key=api_key)
    kwargs: dict = {
        "query": query,
        "topic": topic,
        "max_results": max_results,
        "search_depth": "basic",
    }
    if time_range:
        kwargs["time_range"] = time_range
    return client.search(**kwargs)


def _normalize_tavily_results(raw_response: dict) -> list[dict]:
    results = raw_response.get("results", [])
    return [
        {k: item.get(k) for k in _RESULT_FIELDS}
        for item in results
        if isinstance(item, dict)
    ]


async def search_tavily(
    query: str,
    topic: str = "general",
    max_results: int = 5,
    time_range: str | None = None,
) -> str:
    cleaned = query.strip()
    if not cleaned:
        return json.dumps({"results": [], "error": "empty query"})

    topic = topic if topic in _VALID_TOPICS else "general"
    max_results = min(max(max_results, 1), 20)
    if time_range and time_range not in _VALID_TIME_RANGES:
        time_range = None

    try:
        raw = await asyncio.to_thread(_run_tavily_search, cleaned, topic, max_results, time_range)
        if "error" in raw and not raw.get("results"):
            return json.dumps(raw)
        results = _normalize_tavily_results(raw)
        return json.dumps({"results": results, "topic": topic, "query": cleaned})
    except Exception as e:
        logger.warning(f"Tavily search failed: {type(e).__name__}: {e}")
        return json.dumps({"results": [], "error": "search failed"})
