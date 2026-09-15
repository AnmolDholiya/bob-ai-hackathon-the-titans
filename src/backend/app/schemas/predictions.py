"""
Pydantic schemas for the L1 Congestion Prediction endpoint.

Input  → CongestionPredictionRequest
Output → CongestionPredictionResponse

These mirror the 22 features used by the trained XGBoost + LightGBM ensemble
(see app/ml/features.py for the full feature documentation).

History-rate fields are optional: the upstream sklearn pipeline imputes
median values for any NaN inputs, so callers that lack historical context
can simply omit them.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Request ────────────────────────────────────────────────────────────────────

class CongestionPredictionRequest(BaseModel):
    """
    Tracking snapshot for one vessel, sent to the prediction endpoint.

    All numeric fields accept None; the pipeline imputes missing values.
    history_rate fields are normally unknown at request time — omit them
    and the median from training data will be used.
    """

    # Position / movement
    lat:  Optional[float] = Field(None, description="Latitude (decimal degrees)")
    long: Optional[float] = Field(None, description="Longitude (decimal degrees)")
    sog:  Optional[float] = Field(None, ge=0, description="Speed over ground (knots)")
    cog:  Optional[float] = Field(None, ge=0, lt=360, description="Course over ground (degrees)")
    hdg:  Optional[float] = Field(None, ge=0, lt=360, description="Heading (degrees)")

    # Gap / lead-time features (minutes, clipped ±1000 internally)
    eta_gap_min:   Optional[float] = Field(
        None,
        description="(predicted ETA − scheduled ETA) in minutes"
    )
    etd_gap_min:   Optional[float] = Field(
        None,
        description="(actual ETD − scheduled ETD) in minutes"
    )
    lead_time_min: Optional[float] = Field(
        None,
        description="(scheduled ETA − snapshot timestamp) in minutes"
    )

    # Calendar features derived from snapshot timestamp
    snapshot_hour:  Optional[int] = Field(None, ge=0, le=23)
    snapshot_dow:   Optional[int] = Field(None, ge=0, le=6,  description="0=Monday … 6=Sunday")
    snapshot_month: Optional[int] = Field(None, ge=1, le=12)

    # Calendar features derived from scheduled ETA
    eta_hour:  Optional[int] = Field(None, ge=0, le=23)
    eta_dow:   Optional[int] = Field(None, ge=0, le=6)
    eta_month: Optional[int] = Field(None, ge=1, le=12)

    # Route identifiers (used for one-hot encoding and history rates)
    dep_port: Optional[str] = Field(None, max_length=20, description="Departure port code, e.g. 'NLRTM'")
    arr_port: Optional[str] = Field(None, max_length=20, description="Arrival port code, e.g. 'DEHAM'")

    # Historical congestion rates — optional, imputed when absent
    route_history_rate:        Optional[float] = Field(None, ge=0.0, le=1.0)
    arrival_port_history_rate: Optional[float] = Field(None, ge=0.0, le=1.0)
    vessel_history_rate:       Optional[float] = Field(None, ge=0.0, le=1.0)
    hour_history_rate:         Optional[float] = Field(None, ge=0.0, le=1.0)
    weekday_history_rate:      Optional[float] = Field(None, ge=0.0, le=1.0)

    model_config = {
        "json_schema_extra": {
            "example": {
                "lat": 51.9,
                "long": 4.5,
                "sog": 12.5,
                "cog": 245.0,
                "hdg": 248.0,
                "eta_gap_min": 15.0,
                "etd_gap_min": 0.0,
                "lead_time_min": 180.0,
                "snapshot_hour": 14,
                "snapshot_dow": 2,
                "snapshot_month": 7,
                "eta_hour": 17,
                "eta_dow": 2,
                "eta_month": 7,
                "dep_port": "NLRTM",
                "arr_port": "DEHAM",
            }
        }
    }


# ── Response ───────────────────────────────────────────────────────────────────

class CongestionPredictionResponse(BaseModel):
    """
    Prediction result from the XGBoost + LightGBM ensemble.

    congestion_risk_label: "Normal" | "Congestion Risk"
    congestion_risk_score: raw ensemble probability (0.0 – 1.0)
    threshold:             decision threshold selected on the validation set
    model:                 identifies the ensemble used
    """
    congestion_risk_label: str = Field(
        description='"Normal" or "Congestion Risk"'
    )
    congestion_risk_flag: int = Field(
        description="0 = Normal, 1 = Congestion Risk"
    )
    congestion_risk_score: float = Field(
        description="Raw ensemble probability of congestion (0.0–1.0)"
    )
    threshold: float = Field(
        description="Decision threshold from validation-set selection"
    )
    model: str = Field(
        description="Model identifier"
    )
    model_metrics: Optional[Dict[str, Any]] = Field(
        None,
        description="Test-set metrics from the training run (when metadata is available)"
    )
    features_used: Optional[List[str]] = Field(
        None,
        description="Feature names used by the model"
    )
