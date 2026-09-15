"""
Centralized JSON response envelope helpers.

Every API response should use one of these helpers so the frontend
always receives a consistent shape:

  Success:  {"success": true,  "data": <payload>}
  Error:    {"success": false, "error": "<message>", "detail": <optional>}
"""
from typing import Any, Optional


def success(data: Any) -> dict:
    """Wrap a payload in a success envelope."""
    return {"success": True, "data": data}


def error(message: str, detail: Optional[Any] = None) -> dict:
    """Wrap an error message in a failure envelope."""
    body: dict = {"success": False, "error": message}
    if detail is not None:
        body["detail"] = detail
    return body
