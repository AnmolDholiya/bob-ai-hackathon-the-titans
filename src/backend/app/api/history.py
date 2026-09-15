"""History API routes — GET /api/history, POST /api/history, DELETE /api/history/{id}, DELETE /api/history"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.history import HistoryCreate, HistoryRead
from app.services import history as svc

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=List[HistoryRead], summary="List audit event history")
async def list_history(
    event_type: Optional[str] = Query(None, description="Filter by event_type"),
    search: Optional[str] = Query(None, description="Search description or vessel"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await svc.list_history(
        db, event_type=event_type, search=search, sort_order=sort_order, limit=limit, offset=offset
    )


@router.post("", response_model=HistoryRead, status_code=status.HTTP_201_CREATED, summary="Create history record")
async def create_history(data: HistoryCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_history(db, data)


@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete single history record")
async def delete_history_item(history_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_history_item(db, history_id)


@router.delete("", summary="Clear all history records")
async def clear_all_history(db: AsyncSession = Depends(get_db)):
    count = await svc.clear_all_history(db)
    return {"message": f"Successfully cleared {count} history records."}
