"""
Operations Engine — deterministic business logic layer.

Converts congestion risk predictions into:
  - Alternate route recommendations
  - Berth assignments
  - Crane assignments
  - 72-hour operations plan

All congestion risk / probability values come from the real ML predictor.
This module contains only deterministic rules layered on top of those values.
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml import predictor
from app.ml.features import build_feature_row
from app.models.berth import Berth
from app.models.crane import Crane
from app.models.port import Port
from app.models.vessel import Vessel
from app.schemas.predictions import CongestionPredictionRequest


# ─────────────────────────────────────────────────────────────────────────────
# Internal: run the real ML model for one vessel
# ─────────────────────────────────────────────────────────────────────────────

def _predict_for_vessel(vessel: Vessel) -> Optional[Dict[str, Any]]:
    """Return real ML prediction dict or None if model unavailable."""
    if not predictor.is_available():
        return None
    now = datetime.now(timezone.utc)
    snap_dow = now.weekday()  # Mon=0 … Sun=6
    req = CongestionPredictionRequest(
        sog=vessel.speed_knots,
        dep_port=vessel.departure_port_code,
        arr_port=vessel.arrival_port_code,
        snapshot_hour=now.hour,
        snapshot_dow=snap_dow,
        snapshot_month=now.month,
        eta_gap_min=(vessel.delay_hours * 60) if vessel.delay_hours else None,
        lead_time_min=(
            max(-1000, min(1000, (vessel.scheduled_eta.replace(tzinfo=timezone.utc) - now).total_seconds() / 60))
            if vessel.scheduled_eta else None
        ),
        eta_hour=vessel.scheduled_eta.hour if vessel.scheduled_eta else None,
        eta_dow=vessel.scheduled_eta.weekday() if vessel.scheduled_eta else None,
        eta_month=vessel.scheduled_eta.month if vessel.scheduled_eta else None,
    )
    try:
        df = build_feature_row(req)
        return predictor.predict_congestion(df)
    except Exception:
        return None


def _risk_level(flag: int, score: float) -> str:
    """Map ML flag + score to Low/Medium/High label."""
    if flag == 1:
        return "High" if score >= 0.55 else "Medium"
    return "Low"


def _priority_value(risk: str) -> int:
    return {"High": 3, "Medium": 2, "Low": 1}.get(risk, 0)


# ─────────────────────────────────────────────────────────────────────────────
# Route Recommendations
# ─────────────────────────────────────────────────────────────────────────────

async def get_route_recommendations(
    db: AsyncSession, vessels: Sequence[Vessel]
) -> List[Dict[str, Any]]:
    """Deterministic routing strategy based on real ML congestion prediction."""
    # Load all ports once for alternate-port lookup
    result = await db.execute(select(Port).order_by(Port.port_code))
    all_ports = {p.port_code: p for p in result.scalars().all()}

    recs = []
    for v in vessels:
        pred = _predict_for_vessel(v)
        if pred is None:
            ml_status = "model_unavailable"
            score, flag = None, None
            risk = "Unknown"
        else:
            score = pred["congestion_risk_score"]
            flag  = pred["congestion_risk_flag"]
            risk  = _risk_level(flag, score)
            ml_status = "ok"

        arr_port = all_ports.get(v.arrival_port_code) if v.arrival_port_code else None

        # Deterministic strategy selection
        if risk == "High":
            # Check if arrival port is congested (yard load > 85 % capacity)
            if arr_port and arr_port.yard_capacity_tons > 0:
                yard_pct = arr_port.current_yard_load_tons / arr_port.yard_capacity_tons
            else:
                yard_pct = None

            if yard_pct is not None and yard_pct > 0.85:
                strategy = "delay_arrival"
                reason = (
                    f"High congestion risk ({round(score*100)}% probability). "
                    f"Arrival port yard at {round(yard_pct*100)}% capacity. "
                    "Recommend delaying arrival to allow yard clearance."
                )
            else:
                strategy = "priority_berth"
                reason = (
                    f"High congestion risk ({round(score*100)}% probability). "
                    "Recommend expedited berth assignment and increased crane allocation."
                )
        elif risk == "Medium":
            strategy = "shift_arrival_window"
            reason = (
                f"Moderate congestion risk ({round(score*100) if score else '—'}% probability). "
                "Monitor berth availability. Consider shifting arrival to off-peak window."
            )
        else:
            strategy = "continue"
            reason = "Congestion risk is low. Continue on current schedule."

        recs.append({
            "vessel_id":   v.id,
            "vessel_name": v.vessel_name,
            "imo_number":  v.imo_number,
            "current_route": f"{v.departure_port_code or '—'} → {v.arrival_port_code or '—'}",
            "destination":   v.arrival_port_code,
            "scheduled_eta": v.scheduled_eta.isoformat() if v.scheduled_eta else None,
            "congestion_risk":          risk,
            "congestion_probability":   round(score, 4) if score is not None else None,
            "recommended_strategy":     strategy,
            "reason":                   reason,
            "ml_status":                ml_status,
        })

    recs.sort(key=lambda r: _priority_value(r["congestion_risk"]), reverse=True)
    return recs


# ─────────────────────────────────────────────────────────────────────────────
# Berth Assignment
# ─────────────────────────────────────────────────────────────────────────────

async def get_berth_assignments(
    db: AsyncSession, vessels: Sequence[Vessel]
) -> List[Dict[str, Any]]:
    """Assign vessels to available berths. High-risk vessels get first pick."""
    result = await db.execute(
        select(Berth).where(Berth.status == "operational").order_by(Berth.berth_code)
    )
    available_berths: List[Berth] = list(result.scalars().all())

    # Score vessels by priority
    scored = []
    for v in vessels:
        pred = _predict_for_vessel(v)
        score = pred["congestion_risk_score"] if pred else 0.0
        flag  = pred["congestion_risk_flag"]  if pred else 0
        risk  = _risk_level(flag, score) if pred else "Unknown"
        scored.append((v, risk, score, pred))

    # Sort high-risk first, then by ETA
    scored.sort(key=lambda x: (
        -_priority_value(x[1]),
        x[0].scheduled_eta or datetime.max.replace(tzinfo=None),
    ))

    assigned: List[Dict[str, Any]] = []
    used_berths: set = set()

    for v, risk, score, pred in scored:
        # Find a compatible berth at the arrival port
        best = None
        for b in available_berths:
            if b.id in used_berths:
                continue
            # Soft compatibility: check vessel draft if available
            if v.draft_m and b.max_vessel_draft_m and v.draft_m > b.max_vessel_draft_m:
                continue
            if v.length_m and b.max_vessel_length_m and v.length_m > b.max_vessel_length_m:
                continue
            best = b
            break  # first compatible available berth

        if best:
            used_berths.add(best.id)
            time_window = _berth_window(v)
            assigned.append({
                "vessel_id":    v.id,
                "vessel_name":  v.vessel_name,
                "berth_id":     best.id,
                "berth_code":   best.berth_code,
                "port_id":      best.port_id,
                "time_window":  time_window,
                "priority":     risk,
                "capacity_tons": best.capacity_tons,
                "reason": (
                    f"Assigned berth {best.berth_code} to {v.vessel_name}. "
                    f"Risk: {risk}. "
                    f"{'First priority allocation due to high congestion risk.' if risk == 'High' else 'Standard allocation.'}"
                ),
                "ml_prediction_used": pred is not None,
            })
        else:
            assigned.append({
                "vessel_id":   v.id,
                "vessel_name": v.vessel_name,
                "berth_id":    None,
                "berth_code":  None,
                "port_id":     None,
                "time_window": _berth_window(v),
                "priority":    risk,
                "capacity_tons": None,
                "reason": "No compatible available berth found. Manual assignment required.",
                "ml_prediction_used": pred is not None,
            })

    return assigned


def _berth_window(vessel: Vessel) -> str:
    """Return a human-readable berth time window from scheduled_eta."""
    if vessel.scheduled_eta:
        start = vessel.scheduled_eta
        end   = start + timedelta(hours=6)
        return f"{start.strftime('%Y-%m-%d %H:%M')} – {end.strftime('%H:%M')} UTC"
    return "Window TBD — no scheduled ETA"


# ─────────────────────────────────────────────────────────────────────────────
# Crane Assignment
# ─────────────────────────────────────────────────────────────────────────────

async def get_crane_assignments(
    db: AsyncSession, vessels: Sequence[Vessel]
) -> List[Dict[str, Any]]:
    """Allocate operational cranes to vessels by risk priority."""
    result = await db.execute(
        select(Crane).where(Crane.status == "operational").order_by(Crane.crane_code)
    )
    available_cranes: List[Crane] = list(result.scalars().all())

    scored = []
    for v in vessels:
        pred  = _predict_for_vessel(v)
        score = pred["congestion_risk_score"] if pred else 0.0
        flag  = pred["congestion_risk_flag"]  if pred else 0
        risk  = _risk_level(flag, score) if pred else "Unknown"
        scored.append((v, risk, score, pred))

    scored.sort(key=lambda x: -_priority_value(x[1]))

    used_cranes: set = set()
    assignments: List[Dict[str, Any]] = []

    for v, risk, score, pred in scored:
        # Allocate 2 cranes for High, 1 for Medium/Low
        n_cranes = 2 if risk == "High" else 1
        allocated = []
        for c in available_cranes:
            if c.id in used_cranes:
                continue
            allocated.append(c)
            used_cranes.add(c.id)
            if len(allocated) == n_cranes:
                break

        if allocated:
            assignments.append({
                "vessel_id":   v.id,
                "vessel_name": v.vessel_name,
                "cranes": [{"crane_id": c.id, "crane_code": c.crane_code,
                            "loading_rate": c.loading_rate_tons_per_hour,
                            "unloading_rate": c.unloading_rate_tons_per_hour} for c in allocated],
                "priority": risk,
                "status":   "assigned",
                "reason": (
                    f"{len(allocated)} crane(s) assigned. "
                    f"{'Double-crane allocation due to high congestion priority.' if risk == 'High' else 'Standard single-crane allocation.'}"
                ),
                "ml_prediction_used": pred is not None,
            })
        else:
            assignments.append({
                "vessel_id":   v.id,
                "vessel_name": v.vessel_name,
                "cranes":      [],
                "priority":    risk,
                "status":      "unassigned",
                "reason":      "No operational cranes available. Manual dispatch required.",
                "ml_prediction_used": pred is not None,
            })

    return assignments


# ─────────────────────────────────────────────────────────────────────────────
# 72-Hour Operations Plan
# ─────────────────────────────────────────────────────────────────────────────

async def get_72h_plan(
    db: AsyncSession, vessels: Sequence[Vessel]
) -> Dict[str, Any]:
    """Generate a dynamic 72-hour plan from live vessel + prediction data."""
    now = datetime.now(timezone.utc)

    windows = [
        ("0–24h",  now,                  now + timedelta(hours=24)),
        ("24–48h", now + timedelta(hours=24), now + timedelta(hours=48)),
        ("48–72h", now + timedelta(hours=48), now + timedelta(hours=72)),
    ]

    plan: Dict[str, Any] = {
        "generated_at": now.isoformat(),
        "model":        predictor.MODEL_NAME if predictor.is_available() else "unavailable",
        "windows":      [],
    }

    if not vessels:
        plan["note"] = "No vessels in database. Add vessels to generate an operational plan."
        return plan

    for label, win_start, win_end in windows:
        # Vessels arriving in this window
        window_vessels = [
            v for v in vessels
            if v.scheduled_eta and
            win_start <= v.scheduled_eta.replace(tzinfo=timezone.utc) < win_end
        ]
        # Also include delayed/active vessels without ETA in the first window
        if label == "0–24h":
            window_vessels += [
                v for v in vessels
                if not v.scheduled_eta and v.status in ("active", "en_route", "delayed")
                and v not in window_vessels
            ]

        items = []
        for v in window_vessels:
            pred  = _predict_for_vessel(v)
            score = pred["congestion_risk_score"] if pred else None
            flag  = pred["congestion_risk_flag"]  if pred else 0
            risk  = _risk_level(flag, score) if pred else "Unknown"

            if risk == "High":
                berth_action  = "Expedite berth assignment. Alert berth supervisor."
                crane_action  = "Allocate double crane capacity."
                routing_action = "Prioritize arrival slot. Evaluate delay if yard > 85%."
            elif risk == "Medium":
                berth_action  = "Reserve berth in advance. Monitor availability."
                crane_action  = "Standard crane allocation."
                routing_action = "Monitor ETA deviation. Prepare contingency slot."
            else:
                berth_action  = "Standard berth allocation."
                crane_action  = "Standard crane allocation."
                routing_action = "Continue on schedule."

            items.append({
                "vessel_id":            v.id,
                "vessel_name":          v.vessel_name,
                "imo_number":           v.imo_number,
                "status":               v.status,
                "route":                f"{v.departure_port_code or '—'} → {v.arrival_port_code or '—'}",
                "scheduled_eta":        v.scheduled_eta.isoformat() if v.scheduled_eta else None,
                "congestion_risk":      risk,
                "congestion_probability": round(score, 4) if score is not None else None,
                "operational_priority": _priority_value(risk),
                "berth_action":         berth_action,
                "crane_action":         crane_action,
                "routing_recommendation": routing_action,
                "ml_prediction_used":   pred is not None,
            })

        items.sort(key=lambda x: -x["operational_priority"])
        plan["windows"].append({
            "window":    label,
            "from":      win_start.isoformat(),
            "to":        win_end.isoformat(),
            "vessel_count": len(items),
            "vessels":   items,
        })

    return plan
