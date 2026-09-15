"""Pydantic schemas for Operational Alerts."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AlertCreate(BaseModel):
    severity: str = Field("Medium", pattern="^(Critical|High|Medium|Informational)$")
    title: str = Field(..., max_length=160)
    description: str
    status: str = Field("Active", pattern="^(Active|Acknowledged|Resolved)$")
    vessel_id: Optional[int] = None
    vessel_name: Optional[str] = None
    port_code: Optional[str] = None


class AlertRead(BaseModel):
    id: int
    severity: str
    title: str
    description: str
    status: str
    vessel_id: Optional[int] = None
    vessel_name: Optional[str] = None
    port_code: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
