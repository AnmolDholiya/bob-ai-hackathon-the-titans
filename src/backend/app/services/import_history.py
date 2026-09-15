"""Service layer for ImportHistory CRUD."""
import json
from typing import List, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.import_history import ImportHistory
from app.schemas.import_history import ImportHistoryCreate


async def create_import_history(
    db: AsyncSession, data: ImportHistoryCreate
) -> ImportHistory:
    record = ImportHistory(
        filename=data.filename,
        total_rows=data.total_rows,
        imported_rows=data.imported_rows,
        skipped_rows=data.skipped_rows,
        status=data.status,
        skip_details=json.dumps(data.skip_details) if data.skip_details else None,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def list_import_history(db: AsyncSession) -> Sequence[ImportHistory]:
    result = await db.execute(
        select(ImportHistory).order_by(ImportHistory.imported_at.desc())
    )
    return result.scalars().all()
