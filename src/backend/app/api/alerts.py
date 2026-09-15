"""Alerts API routes — GET /api/alerts, POST /api/alerts, PUT /api/alerts/{id}/read, PUT /api/alerts/mark-all-read, DELETE /api/alerts/{id}"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.alert import AlertCreate, AlertRead
from app.services import alerts as svc

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertRead], summary="List operational alerts")
async def list_alerts(
    severity: Optional[str] = Query(None, description="Critical | High | Medium | Informational"),
    status: Optional[str] = Query(None, description="Active | Acknowledged | Resolved"),
    is_read: Optional[bool] = None,
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    return await svc.list_alerts(db, severity=severity, alert_status=status, is_read=is_read, limit=limit)


@router.post("", response_model=AlertRead, status_code=status.HTTP_201_CREATED, summary="Create operational alert")
async def create_alert(data: AlertCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_alert(db, data)


@router.put("/{alert_id}/read", response_model=AlertRead, summary="Mark alert as read")
async def mark_alert_read(alert_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.mark_alert_read(db, alert_id)


@router.put("/mark-all-read", summary="Mark all alerts as read")
async def mark_all_alerts_read(db: AsyncSession = Depends(get_db)):
    count = await svc.mark_all_alerts_read(db)
    return {"message": f"Marked {count} alerts as read."}


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete single alert")
async def delete_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_alert(db, alert_id)


@router.delete("", summary="Clear all alerts")
async def clear_all_alerts(db: AsyncSession = Depends(get_db)):
    count = await svc.clear_all_alerts(db)
    return {"message": f"Cleared {count} alerts."}
