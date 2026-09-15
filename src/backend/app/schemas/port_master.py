from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


# ── Berth ──────────────────────────────────────────────────────────────────────

class BerthBase(BaseModel):
    berth_code: str = Field(..., min_length=1, max_length=30)
    port_id: int
    capacity_tons: float = Field(0.0, ge=0)
    max_vessel_length_m: Optional[float] = Field(None, ge=0)
    max_vessel_draft_m: Optional[float] = Field(None, ge=0)
    status: str = Field("operational", pattern=r"^(operational|maintenance|occupied)$")
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None


class BerthCreate(BerthBase):
    pass


class BerthUpdate(BaseModel):
    berth_code: Optional[str] = Field(None, min_length=1, max_length=30)
    capacity_tons: Optional[float] = Field(None, ge=0)
    max_vessel_length_m: Optional[float] = Field(None, ge=0)
    max_vessel_draft_m: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern=r"^(operational|maintenance|occupied)$")
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None


class BerthRead(BerthBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ── Crane ──────────────────────────────────────────────────────────────────────

class CraneBase(BaseModel):
    crane_code: str = Field(..., min_length=1, max_length=30)
    port_id: int
    berth_id: Optional[int] = None
    loading_rate_tons_per_hour: float = Field(..., gt=0)
    unloading_rate_tons_per_hour: float = Field(..., gt=0)
    status: str = Field("operational", pattern=r"^(operational|maintenance|offline)$")
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None


class CraneCreate(CraneBase):
    pass


class CraneUpdate(BaseModel):
    crane_code: Optional[str] = Field(None, min_length=1, max_length=30)
    berth_id: Optional[int] = None
    loading_rate_tons_per_hour: Optional[float] = Field(None, gt=0)
    unloading_rate_tons_per_hour: Optional[float] = Field(None, gt=0)
    status: Optional[str] = Field(None, pattern=r"^(operational|maintenance|offline)$")
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None


class CraneRead(CraneBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ── Port ──────────────────────────────────────────────────────────────────────
# Defined after Berth/Crane so PortRead can inline nested lists.

class PortBase(BaseModel):
    port_code: str = Field(..., min_length=1, max_length=20)
    port_name: str = Field(..., min_length=1, max_length=120)
    location: Optional[str] = Field(None, max_length=200)

    max_daily_capacity_tons: float = Field(0.0, ge=0)
    current_cargo_tons: float = Field(0.0, ge=0)

    yard_capacity_tons: float = Field(0.0, ge=0)
    current_yard_load_tons: float = Field(0.0, ge=0)

    max_vessel_length_m: Optional[float] = Field(None, ge=0)
    max_vessel_draft_m: Optional[float] = Field(None, ge=0)
    max_vessel_weight_tons: Optional[float] = Field(None, ge=0)

    @model_validator(mode="after")
    def check_cargo_within_capacity(self) -> "PortBase":
        if self.current_cargo_tons > self.max_daily_capacity_tons:
            raise ValueError(
                "current_cargo_tons cannot exceed max_daily_capacity_tons"
            )
        if self.current_yard_load_tons > self.yard_capacity_tons:
            raise ValueError(
                "current_yard_load_tons cannot exceed yard_capacity_tons"
            )
        return self


class PortCreate(PortBase):
    pass


class PortUpdate(BaseModel):
    port_code: Optional[str] = Field(None, min_length=1, max_length=20)
    port_name: Optional[str] = Field(None, min_length=1, max_length=120)
    location: Optional[str] = Field(None, max_length=200)

    max_daily_capacity_tons: Optional[float] = Field(None, ge=0)
    current_cargo_tons: Optional[float] = Field(None, ge=0)

    yard_capacity_tons: Optional[float] = Field(None, ge=0)
    current_yard_load_tons: Optional[float] = Field(None, ge=0)

    max_vessel_length_m: Optional[float] = Field(None, ge=0)
    max_vessel_draft_m: Optional[float] = Field(None, ge=0)
    max_vessel_weight_tons: Optional[float] = Field(None, ge=0)


class PortRead(PortBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    berths: List[BerthRead] = []
    cranes: List[CraneRead] = []
