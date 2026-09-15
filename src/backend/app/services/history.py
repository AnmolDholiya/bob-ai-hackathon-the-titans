"""Service layer for Persistent Audit Event History."""
from typing import Optional, Sequence

from fastapi import HTTPException, status
from sqlalchemy import delete, desc, asc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.history import History
from app.schemas.history import HistoryCreate


async def create_history(db: AsyncSession, data: HistoryCreate) -> History:
    """Insert a persistent audit history record."""
    item = History(
        event_type=data.event_type,
        description=data.description,
        status=data.status,
        vessel_id=data.vessel_id,
        vessel_name=data.vessel_name,
        user_action=data.user_action or "System",
        details_json=data.details_json,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_history(
    db: AsyncSession,
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    sort_order: str = "desc",
    limit: int = 100,
    offset: int = 0,
) -> Sequence[History]:
    """List audit events with optional filtering, search, and sorting."""
    stmt = select(History)

    if event_type and event_type != "All":
        stmt = stmt.where(History.event_type == event_type)

    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            (History.description.ilike(term))
            | (History.vessel_name.ilike(term))
            | (History.event_type.ilike(term))
        )

    if sort_order == "asc":
        stmt = stmt.order_by(asc(History.timestamp))
    else:
        stmt = stmt.order_by(desc(History.timestamp))

    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


async def delete_history_item(db: AsyncSession, item_id: int) -> None:
    """Delete a single history record."""
    result = await db.execute(select(History).where(History.id == item_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"History record {item_id} not found"
        )
    await db.delete(item)
    await db.commit()


async def clear_all_history(db: AsyncSession) -> int:
    """Clear all history records and return count removed."""
    result = await db.execute(select(History))
    count = len(result.scalars().all())
    await db.execute(delete(History))
    await db.commit()
    return count
