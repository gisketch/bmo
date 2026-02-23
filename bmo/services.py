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
