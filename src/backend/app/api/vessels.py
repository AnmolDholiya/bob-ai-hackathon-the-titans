"""Vessel API routes.

Phase 1: CRUD for vessel records.
Phase 2+: /vessels/{id}/predict will call the ML service.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.vessel import VesselCreate, VesselRead, VesselUpdate
from app.services import vessel as svc

router = APIRouter(prefix="/vessels", tags=["vessels"])


@router.get("", response_model=List[VesselRead])
async def list_vessels(
    status: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db),
):
    return await svc.list_vessels(db, status_filter=status)


@router.get("/{vessel_id}", response_model=VesselRead)
async def get_vessel(vessel_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.get_vessel(db, vessel_id)


@router.post("", response_model=VesselRead, status_code=status.HTTP_201_CREATED)
async def create_vessel(data: VesselCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_vessel(db, data)


@router.put("/{vessel_id}", response_model=VesselRead)
async def update_vessel(
    vessel_id: int, data: VesselUpdate, db: AsyncSession = Depends(get_db)
):
    return await svc.update_vessel(db, vessel_id, data)


@router.delete("/{vessel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vessel(vessel_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_vessel(db, vessel_id)
