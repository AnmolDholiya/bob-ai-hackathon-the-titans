from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.port_master import CraneCreate, CraneRead, CraneUpdate
from app.services import port_master as svc

router = APIRouter(prefix="/cranes", tags=["cranes"])


@router.get("", response_model=List[CraneRead])
async def list_cranes(
    port_id: Optional[int] = Query(None),
    berth_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await svc.list_cranes(db, port_id=port_id, berth_id=berth_id, status_filter=status)


@router.get("/{crane_id}", response_model=CraneRead)
async def get_crane(crane_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.get_crane(db, crane_id)


@router.post("", response_model=CraneRead, status_code=status.HTTP_201_CREATED)
async def create_crane(data: CraneCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_crane(db, data)


@router.put("/{crane_id}", response_model=CraneRead)
async def update_crane(crane_id: int, data: CraneUpdate, db: AsyncSession = Depends(get_db)):
    return await svc.update_crane(db, crane_id, data)


@router.delete("/{crane_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_crane(crane_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_crane(db, crane_id)
