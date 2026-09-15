"""Gemini REST Client Service.

Calls the Google Generative AI REST endpoint directly without external SDK dependencies.
Includes graceful fallback when GEMINI_API_KEY is not configured or if network fails.
"""
import json
import logging
import os
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


def get_gemini_api_key() -> str:
    """Retrieve Gemini API key strictly from backend environment."""
    return settings.gemini_api_key or os.environ.get("GEMINI_API_KEY", "").strip()


def is_gemini_configured() -> bool:
    """Check if a Gemini API key is present."""
    key = get_gemini_api_key()
    return bool(key and len(key) > 5)


async def call_gemini_generate(
    prompt: str,
    system_instruction: Optional[str] = None,
    json_mode: bool = False,
    timeout_seconds: float = 15.0,
) -> Optional[str]:
    """
    Invoke Gemini generateContent via HTTPS REST API.
    Returns response text string or None on failure/unconfigured.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        logger.info("GEMINI_API_KEY not set. Operating in fallback mode.")
        return None

    model = settings.gemini_model or "gemini-1.5-flash"
    url = f"{GEMINI_BASE_URL}/{model}:generateContent?key={api_key}"

    contents = [{"role": "user", "parts": [{"text": prompt}]}]
    payload: Dict[str, Any] = {"contents": contents}

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    generation_config: Dict[str, Any] = {
        "temperature": 0.2,
        "maxOutputTokens": 2048,
    }
    if json_mode:
        generation_config["responseMimeType"] = "application/json"

    payload["generationConfig"] = generation_config

    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
            else:
                logger.warning(
                    f"Gemini API returned status {resp.status_code}: {resp.text[:200]}"
                )
                return None
    except Exception as exc:
        logger.warning(f"Gemini API request failed: {exc}")
        return None

    return None
