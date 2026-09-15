from typing import List, Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.port_master import PortCreate, PortRead, PortUpdate
from app.services import port_master as svc

router = APIRouter(prefix="/ports", tags=["ports"])


@router.get("", response_model=List[PortRead])
async def list_ports(db: AsyncSession = Depends(get_db)):
    return await svc.list_ports(db)


@router.get("/{port_id}", response_model=PortRead)
async def get_port(port_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.get_port(db, port_id)


@router.post("", response_model=PortRead, status_code=status.HTTP_201_CREATED)
async def create_port(data: PortCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_port(db, data)


@router.put("/{port_id}", response_model=PortRead)
async def update_port(port_id: int, data: PortUpdate, db: AsyncSession = Depends(get_db)):
    return await svc.update_port(db, port_id, data)


@router.delete("/{port_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_port(port_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_port(db, port_id)
