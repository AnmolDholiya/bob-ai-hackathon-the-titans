"""Pydantic schemas for Audit Event History."""
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class HistoryCreate(BaseModel):
    event_type: str = Field(..., max_length=60)
    description: str = Field(..., max_length=255)
    status: str = Field("success", max_length=30)
    vessel_id: Optional[int] = None
    vessel_name: Optional[str] = None
    user_action: Optional[str] = "System"
    details_json: Optional[str] = None


class HistoryRead(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    vessel_id: Optional[int] = None
    vessel_name: Optional[str] = None
    description: str
    status: str
    user_action: Optional[str] = None
    details_json: Optional[str] = None

    model_config = {"from_attributes": True}
