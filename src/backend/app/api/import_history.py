"""Import History API — POST /api/import-history  GET /api/import-history"""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.import_history import ImportHistoryCreate, ImportHistoryRead
from app.services.import_history import create_import_history, list_import_history

router = APIRouter(prefix="/import-history", tags=["import-history"])


@router.get("", response_model=List[ImportHistoryRead])
async def get_import_history(db: AsyncSession = Depends(get_db)):
    return await list_import_history(db)


@router.post("", response_model=ImportHistoryRead, status_code=status.HTTP_201_CREATED)
async def record_import(data: ImportHistoryCreate, db: AsyncSession = Depends(get_db)):
    return await create_import_history(db, data)
