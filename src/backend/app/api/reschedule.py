"""Rescheduling API routes — POST /api/reschedule/propose, POST /api/reschedule/apply, POST /api/reschedule/reject"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.reschedule import (
    RescheduleApplyRequest,
    RescheduleApplyResponse,
    RescheduleProposal,
    RescheduleProposeRequest,
)
from app.services import reschedule as svc

router = APIRouter(prefix="/reschedule", tags=["reschedule"])


@router.post(
    "/propose",
    response_model=RescheduleProposal,
    summary="Generate Gemini-assisted, constraint-validated rescheduling proposal",
)
async def propose_reschedule(
    req: RescheduleProposeRequest, db: AsyncSession = Depends(get_db)
):
    """
    Generates an optimized rescheduling recommendation using Gemini with operational context
    (vessel, ports, berths, cranes, yard capacity, and overlapping arrivals).
    The backend deterministically validates and repairs any physical or operational constraints.
    """
    return await svc.generate_reschedule_proposal(
        db, vessel_id=req.vessel_id, operational_notes=req.operational_notes
    )


@router.post(
    "/apply",
    response_model=RescheduleApplyResponse,
    summary="Confirm and apply rescheduling proposal to database",
)
async def apply_reschedule(
    req: RescheduleApplyRequest, db: AsyncSession = Depends(get_db)
):
    """
    Applies the operator-confirmed rescheduling proposal:
    - Updates vessel scheduled and predicted ETA
    - Re-allocates berths and cranes
    - Updates 72-hour operational plan
    - Logs audit history and issues a success notification
    """
    return await svc.apply_reschedule(db, req)


@router.post(
    "/reject",
    status_code=status.HTTP_200_OK,
    summary="Record operator rejection of rescheduling proposal",
)
async def reject_reschedule(
    vessel_id: int = Query(...),
    reason: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    await svc.reject_reschedule(db, vessel_id=vessel_id, reason=reason)
    return {"message": "Rescheduling proposal rejected. Existing schedule preserved."}
