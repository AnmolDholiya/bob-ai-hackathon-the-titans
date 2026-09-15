from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.port_master import BerthCreate, BerthRead, BerthUpdate
from app.services import port_master as svc

router = APIRouter(prefix="/berths", tags=["berths"])


@router.get("", response_model=List[BerthRead])
async def list_berths(
    port_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await svc.list_berths(db, port_id=port_id, status_filter=status)


@router.get("/{berth_id}", response_model=BerthRead)
async def get_berth(berth_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.get_berth(db, berth_id)


@router.post("", response_model=BerthRead, status_code=status.HTTP_201_CREATED)
async def create_berth(data: BerthCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_berth(db, data)


@router.put("/{berth_id}", response_model=BerthRead)
async def update_berth(berth_id: int, data: BerthUpdate, db: AsyncSession = Depends(get_db)):
    return await svc.update_berth(db, berth_id, data)


@router.delete("/{berth_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_berth(berth_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_berth(db, berth_id)
