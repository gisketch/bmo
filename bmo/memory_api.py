from __future__ import annotations

import json
from aiohttp import web

from bmo.config import mem0_client, logger

API_PIN = "4869"
API_PORT = 8484
USER_ID = "glenn"


def _check_pin(request: web.Request) -> bool:
    return request.query.get("pin") == API_PIN


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }


async def handle_options(_request: web.Request) -> web.Response:
    return web.Response(status=204, headers=_cors_headers())


async def handle_get_memories(request: web.Request) -> web.Response:
    if not _check_pin(request):
        return web.json_response({"error": "unauthorized"}, status=401, headers=_cors_headers())

    if mem0_client is None:
        return web.json_response({"error": "mem0 not initialized"}, status=503, headers=_cors_headers())

    try:
        raw = mem0_client.get_all(user_id=USER_ID, limit=5000)
        results = raw.get("results", []) if isinstance(raw, dict) else raw
        if not isinstance(results, list):
            results = []

        memories = []
        for item in results:
            if not isinstance(item, dict):
                continue
            memory_id = item.get("id")
            text = item.get("memory", "")
            metadata = item.get("metadata") if isinstance(item.get("metadata"), dict) else {}
            category = metadata.get("category", "uncategorized") if isinstance(metadata, dict) else "uncategorized"

            if not isinstance(memory_id, str) or not isinstance(text, str):
                continue

            memories.append({
                "id": memory_id,
                "memory": text,
                "category": category or "uncategorized",
            })

        return web.json_response({"memories": memories}, headers=_cors_headers())

    except Exception as e:
        logger.warning(f"Memory API get_all failed: {e}")
        return web.json_response({"error": "failed to fetch memories"}, status=500, headers=_cors_headers())


async def handle_update_memory(request: web.Request) -> web.Response:
    if not _check_pin(request):
        return web.json_response({"error": "unauthorized"}, status=401, headers=_cors_headers())

    if mem0_client is None:
        return web.json_response({"error": "mem0 not initialized"}, status=503, headers=_cors_headers())

    memory_id = request.match_info.get("memory_id", "")
    if not memory_id:
        return web.json_response({"error": "missing memory_id"}, status=400, headers=_cors_headers())

    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400, headers=_cors_headers())

    new_text = body.get("memory", "").strip() if isinstance(body, dict) else ""
    if not new_text:
        return web.json_response({"error": "missing or empty memory field"}, status=400, headers=_cors_headers())

    try:
        mem0_client.update(memory_id, new_text)
        return web.json_response({"ok": True, "id": memory_id, "memory": new_text}, headers=_cors_headers())
    except Exception as e:
        logger.warning(f"Memory API update failed for {memory_id}: {e}")
        return web.json_response({"error": "failed to update memory"}, status=500, headers=_cors_headers())


def create_app() -> web.Application:
    app = web.Application()
    app.router.add_route("OPTIONS", "/api/memories", handle_options)
    app.router.add_route("OPTIONS", "/api/memories/{memory_id}", handle_options)
    app.router.add_get("/api/memories", handle_get_memories)
    app.router.add_put("/api/memories/{memory_id}", handle_update_memory)
    return app


async def start_memory_api() -> None:
    app = create_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", API_PORT)
    await site.start()
    logger.info(f"Memory API listening on port {API_PORT}")
