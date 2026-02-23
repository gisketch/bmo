import asyncio
import json
import os
from datetime import datetime

import httpx

from bmo.config import GMT_PLUS_8, logger

_llm_request_count: int = 0
_llm_request_date: str = ""
_deepgram_project_id: str | None = None


def increment_llm_counter() -> None:
    global _llm_request_count, _llm_request_date
    today = datetime.now(GMT_PLUS_8).strftime("%Y-%m-%d")
    if today != _llm_request_date:
        _llm_request_count = 0
        _llm_request_date = today
    _llm_request_count += 1


async def fetch_fish_audio_balance() -> float | None:
    api_key = os.environ.get("FISH_API_KEY", "")
    if not api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.fish.audio/wallet/self/api-credit",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            resp.raise_for_status()
            data = resp.json()
            return float(data.get("credit", 0))
    except Exception as e:
        logger.warning(f"Fish Audio balance fetch failed: {e}")
        return None


async def fetch_deepgram_balance() -> float | None:
    global _deepgram_project_id
    api_key = os.environ.get("DEEPGRAM_API_KEY", "")
    if not api_key:
        return None
    headers = {"Authorization": f"Token {api_key}"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            project_ids_to_try: list[str] = []
            if isinstance(_deepgram_project_id, str) and _deepgram_project_id:
                project_ids_to_try.append(_deepgram_project_id)

            resp = await client.get(
                "https://api.deepgram.com/v1/projects",
                headers=headers,
            )
            resp.raise_for_status()
            projects = resp.json().get("projects", [])
            for proj in projects:
                pid = proj.get("project_id") if isinstance(proj, dict) else None
                if isinstance(pid, str) and pid and pid not in project_ids_to_try:
                    project_ids_to_try.append(pid)

            for project_id in project_ids_to_try:
                try:
                    bal_resp = await client.get(
                        f"https://api.deepgram.com/v1/projects/{project_id}/balances",
                        headers=headers,
                    )
                    bal_resp.raise_for_status()
                except httpx.HTTPStatusError as status_err:
                    if status_err.response is not None and status_err.response.status_code == 403:
                        continue
                    raise

                balances = bal_resp.json().get("balances", [])
                if not balances:
                    _deepgram_project_id = project_id
                    return None

                _deepgram_project_id = project_id
                return float(balances[0].get("amount", 0))

            return None
    except Exception as e:
        logger.warning(f"DeepGram balance fetch failed: {e}")
        return None


async def build_status_response() -> str:
    tts_balance, stt_balance = await asyncio.gather(
        fetch_fish_audio_balance(),
        fetch_deepgram_balance(),
    )
    return json.dumps({
        "tts_balance": tts_balance,
        "stt_balance": stt_balance,
        "llm_requests_today": _llm_request_count,
    })
