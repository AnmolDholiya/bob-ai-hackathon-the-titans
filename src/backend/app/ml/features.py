"""
Feature adapter for the L1 Congestion Predictor.

Translates a validated PredictionRequest into a single-row pandas DataFrame
with exactly the 22 columns expected by the XGBoost/LightGBM pipelines.

Feature definitions (from the training notebook):
─────────────────────────────────────────────────────────────────────────────
NUMERIC:
  lat               — vessel latitude at snapshot time
  long              — vessel longitude at snapshot time
  sog               — speed over ground (knots)
  cog               — course over ground (degrees 0–360)
  hdg               — heading (degrees 0–360)
  heading_difference— |cog − hdg| wrapped to 0–180 (derived)
  eta_gap_min       — (predicted ETA − scheduled ETA) in minutes, clipped ±1000
  etd_gap_min       — (actual ETD − scheduled ETD) in minutes, clipped ±1000
  lead_time_min     — (scheduled ETA − snapshot time) in minutes, clipped ±1000
  snapshot_hour     — hour-of-day of the tracking snapshot (0–23)
  snapshot_dow      — day-of-week of the snapshot (0=Mon … 6=Sun)
  snapshot_month    — month of the snapshot (1–12)
  eta_hour          — hour-of-day of scheduled ETA (0–23)
  eta_dow           — day-of-week of scheduled ETA
  eta_month         — month of scheduled ETA

  # Historical rates — null / NaN accepted; the pipeline imputes medians.
  route_history_rate         — past congestion rate on this dep>arr route
  arrival_port_history_rate  — past congestion rate at arrival port
  vessel_history_rate        — past congestion rate for this vessel (IMO)
  hour_history_rate          — past congestion rate at this snapshot hour
  weekday_history_rate       — past congestion rate on this weekday

CATEGORICAL (sklearn OneHotEncoder with handle_unknown="ignore"):
  route     — "{depPort}>{arrPort}"  e.g. "NLRTM>DEHAM"
  depPort   — departure port code
  arrPort   — arrival port code
─────────────────────────────────────────────────────────────────────────────

The training pipeline already handles:
  • median imputation of numeric nulls
  • most-frequent imputation + one-hot encoding of categoricals
So this adapter only needs to build the correctly named, correctly typed row.
"""
from __future__ import annotations

import math
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import pandas as pd

# Exact feature order used during training (must NOT be changed)
FEATURE_ORDER = [
    "lat", "long", "sog", "cog", "hdg",
    "heading_difference",
    "eta_gap_min", "etd_gap_min", "lead_time_min",
    "snapshot_hour", "snapshot_dow", "snapshot_month",
    "eta_hour", "eta_dow", "eta_month",
    "route", "depPort", "arrPort",
    "route_history_rate",
    "arrival_port_history_rate",
    "vessel_history_rate",
    "hour_history_rate",
    "weekday_history_rate",
]

# These numeric features are clipped to ±1000 in the training script
_CLIPPED_FEATURES = {"eta_gap_min", "etd_gap_min", "lead_time_min"}
_CLIP_LIMIT = 1000.0


def _clip(value: float | None, feature: str) -> float | None:
    """Apply ±1000 clipping for the three gap/lead features."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    if feature in _CLIPPED_FEATURES:
        return max(-_CLIP_LIMIT, min(_CLIP_LIMIT, value))
    return value


def _heading_difference(cog: float | None, hdg: float | None) -> float | None:
    """
    Compute |cog − hdg| wrapped to [0, 180].
    Matches the training notebook formula:
        abs((cog - hdg + 180) % 360 - 180)
    """
    if cog is None or hdg is None:
        return None
    return abs((cog - hdg + 180) % 360 - 180)


def build_feature_row(req: object) -> "pd.DataFrame":
    """
    Convert a CongestionPredictionRequest (or any object with the same
    attributes) into a one-row DataFrame ready for Pipeline.predict_proba().

    pandas import is deferred so that FastAPI starts even when ML packages
    are not yet installed; the error surfaces at prediction time.
    """
    try:
        import pandas as pd
    except ImportError as exc:
        raise RuntimeError(
            "pandas is required for ML inference. "
            "Install: pip install -r requirements.txt"
        ) from exc

    # Derived feature
    hdiff = _heading_difference(getattr(req, "cog", None), getattr(req, "hdg", None))

    dep = getattr(req, "dep_port", None)
    arr = getattr(req, "arr_port", None)
    route = f"{dep}>{arr}" if dep and arr else None

    row = {
        "lat":   getattr(req, "lat", None),
        "long":  getattr(req, "long", None),
        "sog":   getattr(req, "sog", None),
        "cog":   getattr(req, "cog", None),
        "hdg":   getattr(req, "hdg", None),
        "heading_difference": hdiff,
        "eta_gap_min":   _clip(getattr(req, "eta_gap_min",   None), "eta_gap_min"),
        "etd_gap_min":   _clip(getattr(req, "etd_gap_min",   None), "etd_gap_min"),
        "lead_time_min": _clip(getattr(req, "lead_time_min", None), "lead_time_min"),
        "snapshot_hour":  getattr(req, "snapshot_hour",  None),
        "snapshot_dow":   getattr(req, "snapshot_dow",   None),
        "snapshot_month": getattr(req, "snapshot_month", None),
        "eta_hour":  getattr(req, "eta_hour",  None),
        "eta_dow":   getattr(req, "eta_dow",   None),
        "eta_month": getattr(req, "eta_month", None),
        "route":    route,
        "depPort":  dep,
        "arrPort":  arr,
        "route_history_rate":          getattr(req, "route_history_rate",         None),
        "arrival_port_history_rate":   getattr(req, "arrival_port_history_rate",  None),
        "vessel_history_rate":         getattr(req, "vessel_history_rate",        None),
        "hour_history_rate":           getattr(req, "hour_history_rate",          None),
        "weekday_history_rate":        getattr(req, "weekday_history_rate",       None),
    }

    # Return DataFrame with exact column order
    return pd.DataFrame([row], columns=FEATURE_ORDER)
