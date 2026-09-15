"""CRUD service for Vessel.

All functions accept an AsyncSession and raise HTTPException on errors
so the API layer remains thin.
"""
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vessel import Vessel
from app.schemas.vessel import VesselCreate, VesselUpdate


# ── helpers ────────────────────────────────────────────────────────────────────

async def _get_vessel_or_404(db: AsyncSession, vessel_id: int) -> Vessel:
    result = await db.execute(select(Vessel).where(Vessel.id == vessel_id))
    vessel = result.scalar_one_or_none()
    if vessel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vessel {vessel_id} not found",
        )
    return vessel


# ── Vessel CRUD ────────────────────────────────────────────────────────────────

async def list_vessels(
    db: AsyncSession,
    status_filter: str | None = None,
) -> Sequence[Vessel]:
    q = select(Vessel).order_by(Vessel.vessel_name)
    if status_filter is not None:
        q = q.where(Vessel.status == status_filter)
    result = await db.execute(q)
    return result.scalars().all()


async def get_vessel(db: AsyncSession, vessel_id: int) -> Vessel:
    return await _get_vessel_or_404(db, vessel_id)


async def get_vessel_by_imo(db: AsyncSession, imo_number: str) -> Vessel:
    result = await db.execute(select(Vessel).where(Vessel.imo_number == imo_number))
    vessel = result.scalar_one_or_none()
    if vessel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vessel with IMO '{imo_number}' not found",
        )
    return vessel


async def create_vessel(db: AsyncSession, data: VesselCreate) -> Vessel:
    existing = await db.execute(
        select(Vessel).where(Vessel.imo_number == data.imo_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Vessel with IMO '{data.imo_number}' already exists",
        )
    vessel = Vessel(**data.model_dump())
    db.add(vessel)
    await db.commit()
    await db.refresh(vessel)
    return vessel


async def update_vessel(db: AsyncSession, vessel_id: int, data: VesselUpdate) -> Vessel:
    vessel = await _get_vessel_or_404(db, vessel_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(vessel, field, value)
    await db.commit()
    await db.refresh(vessel)
    return vessel


async def delete_vessel(db: AsyncSession, vessel_id: int) -> None:
    vessel = await _get_vessel_or_404(db, vessel_id)
    await db.delete(vessel)
    await db.commit()
