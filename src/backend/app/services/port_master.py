"""
CRUD helpers for Port, Berth, Crane.

All functions accept an AsyncSession and return ORM objects or raise
HTTPException with appropriate status codes.
"""
from typing import List, Optional, Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.berth import Berth
from app.models.crane import Crane
from app.models.port import Port
from app.schemas.port_master import (
    BerthCreate,
    BerthUpdate,
    CraneCreate,
    CraneUpdate,
    PortCreate,
    PortUpdate,
)


# ── helpers ────────────────────────────────────────────────────────────────────

async def _get_port_or_404(db: AsyncSession, port_id: int) -> Port:
    result = await db.execute(select(Port).where(Port.id == port_id))
    port = result.scalar_one_or_none()
    if port is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Port {port_id} not found")
    return port


async def _get_berth_or_404(db: AsyncSession, berth_id: int) -> Berth:
    result = await db.execute(select(Berth).where(Berth.id == berth_id))
    berth = result.scalar_one_or_none()
    if berth is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Berth {berth_id} not found")
    return berth


async def _get_crane_or_404(db: AsyncSession, crane_id: int) -> Crane:
    result = await db.execute(select(Crane).where(Crane.id == crane_id))
    crane = result.scalar_one_or_none()
    if crane is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Crane {crane_id} not found")
    return crane


# ── Port CRUD ──────────────────────────────────────────────────────────────────

async def list_ports(db: AsyncSession) -> Sequence[Port]:
    result = await db.execute(
        select(Port)
        .order_by(Port.port_code)
        .options(selectinload(Port.berths), selectinload(Port.cranes))
    )
    return result.scalars().all()


async def get_port(db: AsyncSession, port_id: int) -> Port:
    result = await db.execute(
        select(Port)
        .where(Port.id == port_id)
        .options(selectinload(Port.berths), selectinload(Port.cranes))
    )
    port = result.scalar_one_or_none()
    if port is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Port {port_id} not found")
    return port


async def create_port(db: AsyncSession, data: PortCreate) -> Port:
    # Unique port_code check
    existing = await db.execute(select(Port).where(Port.port_code == data.port_code))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Port code '{data.port_code}' already exists",
        )
    port = Port(**data.model_dump())
    db.add(port)
    await db.commit()
    await db.refresh(port)
    return port


async def update_port(db: AsyncSession, port_id: int, data: PortUpdate) -> Port:
    port = await _get_port_or_404(db, port_id)
    updates = data.model_dump(exclude_unset=True)

    # If updating code, check uniqueness
    if "port_code" in updates and updates["port_code"] != port.port_code:
        existing = await db.execute(select(Port).where(Port.port_code == updates["port_code"]))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Port code '{updates['port_code']}' already exists",
            )

    # Merge and re-validate cargo constraints
    for field, value in updates.items():
        setattr(port, field, value)

    max_cargo = port.max_daily_capacity_tons
    cur_cargo = port.current_cargo_tons
    if cur_cargo > max_cargo:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="current_cargo_tons cannot exceed max_daily_capacity_tons",
        )
    if port.current_yard_load_tons > port.yard_capacity_tons:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="current_yard_load_tons cannot exceed yard_capacity_tons",
        )

    await db.commit()
    await db.refresh(port)
    return port


async def delete_port(db: AsyncSession, port_id: int) -> None:
    port = await _get_port_or_404(db, port_id)
    await db.delete(port)
    await db.commit()


# ── Berth CRUD ──────────────────────────────────────────────────────────────────

async def list_berths(
    db: AsyncSession,
    port_id: Optional[int] = None,
    status_filter: Optional[str] = None,
) -> Sequence[Berth]:
    q = select(Berth).order_by(Berth.berth_code)
    if port_id is not None:
        q = q.where(Berth.port_id == port_id)
    if status_filter is not None:
        q = q.where(Berth.status == status_filter)
    result = await db.execute(q)
    return result.scalars().all()


async def get_berth(db: AsyncSession, berth_id: int) -> Berth:
    return await _get_berth_or_404(db, berth_id)


async def create_berth(db: AsyncSession, data: BerthCreate) -> Berth:
    # port must exist
    await _get_port_or_404(db, data.port_id)

    # berth_code unique within port
    existing = await db.execute(
        select(Berth).where(Berth.port_id == data.port_id, Berth.berth_code == data.berth_code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Berth code '{data.berth_code}' already exists in port {data.port_id}",
        )

    berth = Berth(**data.model_dump())
    db.add(berth)
    await db.commit()
    await db.refresh(berth)
    return berth


async def update_berth(db: AsyncSession, berth_id: int, data: BerthUpdate) -> Berth:
    berth = await _get_berth_or_404(db, berth_id)
    updates = data.model_dump(exclude_unset=True)

    if "berth_code" in updates and updates["berth_code"] != berth.berth_code:
        existing = await db.execute(
            select(Berth).where(Berth.port_id == berth.port_id, Berth.berth_code == updates["berth_code"])
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Berth code '{updates['berth_code']}' already exists in this port",
            )

    for field, value in updates.items():
        setattr(berth, field, value)

    await db.commit()
    await db.refresh(berth)
    return berth


async def delete_berth(db: AsyncSession, berth_id: int) -> None:
    berth = await _get_berth_or_404(db, berth_id)
    await db.delete(berth)
    await db.commit()


# ── Crane CRUD ──────────────────────────────────────────────────────────────────

async def list_cranes(
    db: AsyncSession,
    port_id: Optional[int] = None,
    berth_id: Optional[int] = None,
    status_filter: Optional[str] = None,
) -> Sequence[Crane]:
    q = select(Crane).order_by(Crane.crane_code)
    if port_id is not None:
        q = q.where(Crane.port_id == port_id)
    if berth_id is not None:
        q = q.where(Crane.berth_id == berth_id)
    if status_filter is not None:
        q = q.where(Crane.status == status_filter)
    result = await db.execute(q)
    return result.scalars().all()


async def get_crane(db: AsyncSession, crane_id: int) -> Crane:
    return await _get_crane_or_404(db, crane_id)


async def create_crane(db: AsyncSession, data: CraneCreate) -> Crane:
    # port must exist
    await _get_port_or_404(db, data.port_id)

    # if berth given, it must exist AND belong to the same port
    if data.berth_id is not None:
        berth = await _get_berth_or_404(db, data.berth_id)
        if berth.port_id != data.port_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Berth does not belong to the specified port",
            )

    # crane_code unique within port
    existing = await db.execute(
        select(Crane).where(Crane.port_id == data.port_id, Crane.crane_code == data.crane_code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Crane code '{data.crane_code}' already exists in port {data.port_id}",
        )

    crane = Crane(**data.model_dump())
    db.add(crane)
    await db.commit()
    await db.refresh(crane)
    return crane


async def update_crane(db: AsyncSession, crane_id: int, data: CraneUpdate) -> Crane:
    crane = await _get_crane_or_404(db, crane_id)
    updates = data.model_dump(exclude_unset=True)

    # if updating berth_id, validate it belongs to the crane's port
    if "berth_id" in updates and updates["berth_id"] is not None:
        berth = await _get_berth_or_404(db, updates["berth_id"])
        if berth.port_id != crane.port_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Berth does not belong to the crane's port",
            )

    if "crane_code" in updates and updates["crane_code"] != crane.crane_code:
        existing = await db.execute(
            select(Crane).where(Crane.port_id == crane.port_id, Crane.crane_code == updates["crane_code"])
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Crane code '{updates['crane_code']}' already exists in this port",
            )

    for field, value in updates.items():
        setattr(crane, field, value)

    await db.commit()
    await db.refresh(crane)
    return crane


async def delete_crane(db: AsyncSession, crane_id: int) -> None:
    crane = await _get_crane_or_404(db, crane_id)
    await db.delete(crane)
    await db.commit()
