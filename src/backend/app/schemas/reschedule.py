"""Pydantic schemas for Rescheduling Flow."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RescheduleProposeRequest(BaseModel):
    vessel_id: int
    operational_notes: Optional[str] = None


class RescheduleProposal(BaseModel):
    vessel_id: int
    vessel_name: str
    imo_number: Optional[str] = None
    current_eta: Optional[str] = None
    recommended_eta: Optional[str] = None
    congestion_risk: str
    congestion_score: Optional[float] = None
    route_action: str
    berth_action: str
    berth_id: Optional[int] = None
    berth_code: Optional[str] = None
    crane_action: str
    assigned_cranes: List[str] = Field(default_factory=list)
    reason: str
    affected_vessels: List[str] = Field(default_factory=list)
    confidence: float = 0.85
    validation_notes: List[str] = Field(default_factory=list)
    is_constraint_valid: bool = True
    ai_provider: str = "gemini"  # gemini | deterministic_fallback


class RescheduleApplyRequest(BaseModel):
    vessel_id: int
    recommended_eta: Optional[str] = None
    berth_code: Optional[str] = None
    assigned_cranes: List[str] = Field(default_factory=list)
    route_action: Optional[str] = None
    reason: Optional[str] = None


class RescheduleApplyResponse(BaseModel):
    success: bool
    vessel_id: int
    vessel_name: str
    updated_eta: Optional[str] = None
    berth_assigned: Optional[str] = None
    cranes_assigned: List[str] = Field(default_factory=list)
    message: str
    plan_updated: bool = True
