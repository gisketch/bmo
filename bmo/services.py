import asyncio
import json
import os

import httpx
from duckduckgo_search import DDGS
from duckduckgo_search.exceptions import DuckDuckGoSearchException, RatelimitException, TimeoutException

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


_TEXT_FIELDS = ("title", "href", "body")
_NEWS_FIELDS = ("date", "title", "body", "url", "source")
_VIDEO_FIELDS = ("title", "description", "content", "publisher", "duration")

_MODE_CONFIG: dict[str, tuple[str, tuple[str, ...]]] = {
    "text": ("text", _TEXT_FIELDS),
    "news": ("news", _NEWS_FIELDS),
    "videos": ("videos", _VIDEO_FIELDS),
}


def _run_ddgs_search(query: str, mode: str, max_results: int, timelimit: str | None) -> list[dict]:
    method_name, _ = _MODE_CONFIG.get(mode, _MODE_CONFIG["text"])
    ddgs = DDGS(timeout=12)
    search_fn = getattr(ddgs, method_name)
    kwargs: dict = {"keywords": query, "max_results": max_results}
    if timelimit:
        kwargs["timelimit"] = timelimit
    return search_fn(**kwargs)


def _normalize_results(raw: list[dict], mode: str) -> list[dict]:
    _, fields = _MODE_CONFIG.get(mode, _MODE_CONFIG["text"])
    return [{k: item.get(k) for k in fields} for item in raw if isinstance(item, dict)]


async def search_duckduckgo(query: str, mode: str = "text", max_results: int = 5, timelimit: str | None = None) -> str:
    cleaned = query.strip()
    if not cleaned:
        return json.dumps({"results": [], "error": "empty query"})

    mode = mode if mode in _MODE_CONFIG else "text"
    max_results = min(max(max_results, 1), 10)

    try:
        raw = await asyncio.to_thread(_run_ddgs_search, cleaned, mode, max_results, timelimit)
        results = _normalize_results(raw, mode)
        return json.dumps({"results": results, "mode": mode, "query": cleaned})
    except RatelimitException:
        logger.warning("DuckDuckGo rate limited")
        return json.dumps({"results": [], "error": "rate limited"})
    except TimeoutException:
        logger.warning("DuckDuckGo search timed out")
        return json.dumps({"results": [], "error": "search timed out"})
    except DuckDuckGoSearchException as e:
        logger.warning(f"DuckDuckGo search error: {e}")
        return json.dumps({"results": [], "error": str(e)})
    except Exception as e:
        logger.warning(f"DuckDuckGo search failed: {type(e).__name__}")
        return json.dumps({"results": [], "error": "search failed"})
