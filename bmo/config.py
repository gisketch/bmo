import logging
import os
from datetime import timezone, timedelta
from pathlib import Path

from dotenv import load_dotenv
from mem0 import Memory

load_dotenv(".env.local")

logger = logging.getLogger("bmo-agent")

ROOM_NAME = "bmo-room"
AGENT_NAME = "voice-agent"
PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "bmo.json"
GMT_PLUS_8 = timezone(timedelta(hours=8))
OBSIDIAN_SEARCH_URL_DEFAULT = "http://188.209.141.228:18000/api/v1/search"
WATCHDOG_INTERVAL = 30

_MEM0_SETTING_RAW = (os.getenv("MEM0_SETTING") or "GATED").strip().upper()
MEM0_SETTING = _MEM0_SETTING_RAW if _MEM0_SETTING_RAW in {"NORMAL", "GATED"} else "GATED"

logger.info(f"MEM0_SETTING={MEM0_SETTING}")

MEM0_CONFIG = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "host": "localhost",
            "port": 6333,
            "embedding_model_dims": 768,
        },
    },
    "llm": {
        "provider": "gemini",
        "config": {
            "model": "gemini-3-flash-preview",
        }
    },
    "embedder": {
        "provider": "gemini",
        "config": {
            "model": "models/gemini-embedding-001",
        }
    }
}

try:
    mem0_client = Memory.from_config(MEM0_CONFIG)
    logger.info("Mem0 client initialized successfully.")
except Exception as e:
    logger.warning(f"Failed to initialize Mem0: {e}")
    mem0_client = None
