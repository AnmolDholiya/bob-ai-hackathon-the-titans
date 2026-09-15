"""Pydantic schemas for Notifications."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    title: str = Field(..., max_length=160)
    message: str
    severity: str = Field("info", pattern="^(info|warning|error|success)$")
    vessel_name: Optional[str] = None
    action_url: Optional[str] = None


class NotificationRead(BaseModel):
    id: int
    title: str
    message: str
    severity: str
    vessel_name: Optional[str] = None
    action_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
