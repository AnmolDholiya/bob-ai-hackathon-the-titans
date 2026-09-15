"""Notifications API routes — GET /api/notifications, PUT /api/notifications/{id}/read, PUT /api/notifications/mark-all-read, DELETE /api/notifications/{id}"""
from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.notification import NotificationCreate, NotificationRead
from app.services import notifications as svc

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationRead], summary="List notifications")
async def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    return await svc.list_notifications(db, unread_only=unread_only, limit=limit)


@router.get("/unread-count", summary="Get unread notifications count")
async def get_unread_count(db: AsyncSession = Depends(get_db)):
    count = await svc.count_unread_notifications(db)
    return {"unread_count": count}


@router.post("", response_model=NotificationRead, status_code=status.HTTP_201_CREATED, summary="Create notification")
async def create_notification(data: NotificationCreate, db: AsyncSession = Depends(get_db)):
    return await svc.create_notification(db, data)


@router.put("/{notif_id}/read", response_model=NotificationRead, summary="Mark notification as read")
async def mark_notification_read(notif_id: int, db: AsyncSession = Depends(get_db)):
    return await svc.mark_notification_read(db, notif_id)


@router.put("/mark-all-read", summary="Mark all notifications as read")
async def mark_all_notifications_read(db: AsyncSession = Depends(get_db)):
    count = await svc.mark_all_notifications_read(db)
    return {"message": f"Marked {count} notifications as read."}


@router.delete("/{notif_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete single notification")
async def delete_notification(notif_id: int, db: AsyncSession = Depends(get_db)):
    await svc.delete_notification(db, notif_id)


@router.delete("", summary="Clear all notifications")
async def clear_all_notifications(db: AsyncSession = Depends(get_db)):
    count = await svc.clear_all_notifications(db)
    return {"message": f"Cleared {count} notifications."}
