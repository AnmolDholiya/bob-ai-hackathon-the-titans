"""Pydantic schemas for Operational Reports & Live Analytics."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FleetStatusKPI(BaseModel):
    total_vessels: int
    active: int
    en_route: int
    delayed: int
    berthed: int
    high_risk: int
    medium_risk: int
    low_risk: int


class PortUtilizationKPI(BaseModel):
    port_code: str
    port_name: str
    utilization_pct: float
    current_cargo_tons: float
    max_daily_capacity_tons: float
    yard_utilization_pct: float


class DistributionItem(BaseModel):
    label: str
    value: int
    percentage: float
    color: Optional[str] = None


class ReportAnalyticsResponse(BaseModel):
    generated_at: datetime
    fleet: FleetStatusKPI
    congestion_distribution: List[DistributionItem]
    delay_distribution: List[DistributionItem]
    vessel_status_distribution: List[DistributionItem]
    ports: List[PortUtilizationKPI]
    berth_utilization_pct: float
    crane_operational_pct: float
    total_alerts: int
    critical_alerts: int
    active_72h_vessels: int
    recent_events_count: int
