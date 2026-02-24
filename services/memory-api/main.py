from __future__ import annotations

import os
import logging

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mem0 import Memory
from qdrant_client import QdrantClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("memory-api")

API_PIN = os.getenv("API_PIN", "4869")
USER_ID = os.getenv("USER_ID", "glenn")
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))

MEM0_CONFIG = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "host": QDRANT_HOST,
            "port": QDRANT_PORT,
            "embedding_model_dims": 768,
        },
    },
    "llm": {
        "provider": "gemini",
        "config": {"model": "gemini-3-flash-preview"},
    },
    "embedder": {
        "provider": "gemini",
        "config": {"model": "models/gemini-embedding-001"},
    },
}

try:
    mem0_client = Memory.from_config(MEM0_CONFIG)
    logger.info("mem0 client initialized (qdrant=%s:%d)", QDRANT_HOST, QDRANT_PORT)
except Exception as exc:
    logger.warning("Failed to init mem0: %s", exc)
    mem0_client = None

app = FastAPI(title="BMO Memory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


def _check_pin(pin: str | None) -> None:
    if pin != API_PIN:
        raise HTTPException(status_code=401, detail="unauthorized")


def _require_client() -> Memory:
    if mem0_client is None:
        raise HTTPException(status_code=503, detail="mem0 not initialized")
    return mem0_client


class UpdateBody(BaseModel):
    memory: str
    category: str | None = None


class AddBody(BaseModel):
    memory: str
    category: str = "uncategorized"


@app.get("/api/memories")
def get_memories(pin: str | None = Query(default=None)):
    _check_pin(pin)
    client = _require_client()

    raw = client.get_all(user_id=USER_ID, limit=5000)
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
        created_at = item.get("created_at", "")
        updated_at = item.get("updated_at", "")
        if not isinstance(memory_id, str) or not isinstance(text, str):
            continue
        memories.append({
            "id": memory_id,
            "memory": text,
            "category": category or "uncategorized",
            "created_at": created_at or "",
            "updated_at": updated_at or "",
        })

    return {"memories": memories}


@app.post("/api/memories")
def add_memory(body: AddBody, pin: str | None = Query(default=None)):
    _check_pin(pin)
    client = _require_client()

    text = body.memory.strip()
    if not text:
        raise HTTPException(status_code=400, detail="missing or empty memory field")

    category = body.category.strip() or "uncategorized"
    result = client.add(text, user_id=USER_ID, metadata={"category": category})

    new_id = ""
    if isinstance(result, dict):
        results = result.get("results", [])
        if results and isinstance(results, list) and isinstance(results[0], dict):
            new_id = results[0].get("id", "")

    return {"ok": True, "id": new_id, "memory": text, "category": category}


@app.put("/api/memories/{memory_id}")
def update_memory(memory_id: str, body: UpdateBody, pin: str | None = Query(default=None)):
    _check_pin(pin)
    client = _require_client()

    text = body.memory.strip()
    if not text:
        raise HTTPException(status_code=400, detail="missing or empty memory field")

    client.update(memory_id, text)
    if body.category is not None:
        qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        qdrant.set_payload(
            collection_name="mem0",
            payload={"category": body.category},
            points=[memory_id],
        )
    return {"ok": True, "id": memory_id, "memory": text, "category": body.category}


@app.delete("/api/memories/{memory_id}")
def delete_memory(memory_id: str, pin: str | None = Query(default=None)):
    _check_pin(pin)
    client = _require_client()
    client.delete(memory_id)
    return {"ok": True, "id": memory_id}
