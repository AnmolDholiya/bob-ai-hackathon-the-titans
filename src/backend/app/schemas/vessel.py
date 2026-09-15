"""Pydantic schemas for Vessel CRUD and prediction responses."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VesselBase(BaseModel):
    imo_number: str = Field(..., min_length=1, max_length=20)
    vessel_name: str = Field(..., min_length=1, max_length=120)
    vessel_type: Optional[str] = Field(None, max_length=60)
    flag_code: Optional[str] = Field(None, max_length=10)

    length_m: Optional[float] = Field(None, gt=0)
    draft_m: Optional[float] = Field(None, gt=0)
    gross_tonnage: Optional[float] = Field(None, gt=0)

    status: str = Field(
        "active",
        pattern=r"^(active|en_route|berthed|delayed|inactive)$",
    )
    current_location: Optional[str] = Field(None, max_length=200)
    speed_knots: Optional[float] = Field(None, ge=0)

    departure_port_code: Optional[str] = Field(None, max_length=20)
    arrival_port_code: Optional[str] = Field(None, max_length=20)
    scheduled_eta: Optional[datetime] = None
    predicted_eta: Optional[datetime] = None

    delay_hours: Optional[float] = Field(None, ge=0)
    congestion_risk: Optional[str] = Field(
        None,
        pattern=r"^(low|medium|high)$",
    )


class VesselCreate(VesselBase):
    pass


class VesselUpdate(BaseModel):
    vessel_name: Optional[str] = Field(None, min_length=1, max_length=120)
    vessel_type: Optional[str] = Field(None, max_length=60)
    flag_code: Optional[str] = Field(None, max_length=10)

    length_m: Optional[float] = Field(None, gt=0)
    draft_m: Optional[float] = Field(None, gt=0)
    gross_tonnage: Optional[float] = Field(None, gt=0)

    status: Optional[str] = Field(
        None,
        pattern=r"^(active|en_route|berthed|delayed|inactive)$",
    )
    current_location: Optional[str] = Field(None, max_length=200)
    speed_knots: Optional[float] = Field(None, ge=0)

    departure_port_code: Optional[str] = Field(None, max_length=20)
    arrival_port_code: Optional[str] = Field(None, max_length=20)
    scheduled_eta: Optional[datetime] = None
    predicted_eta: Optional[datetime] = None

    delay_hours: Optional[float] = Field(None, ge=0)
    congestion_risk: Optional[str] = Field(
        None,
        pattern=r"^(low|medium|high)$",
    )


class VesselRead(VesselBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ── Prediction-oriented response (Phase 2+) ───────────────────────────────────

class VesselDelayPrediction(BaseModel):
    """Returned by the prediction endpoint (ML model output, Phase 2+)."""
    vessel_id: int
    imo_number: str
    vessel_name: str
    predicted_delay_hours: float
    congestion_risk: str           # low | medium | high
    confidence: float = Field(..., ge=0.0, le=1.0)
    predicted_eta: Optional[datetime]
    reasoning: Optional[str] = None  # human-readable explanation from model
