"""Service layer for Real-time Notifications."""
from typing import Optional, Sequence

from fastapi import HTTPException, status
from sqlalchemy import delete, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.vessel import Vessel
from app.schemas.notification import NotificationCreate


async def create_notification(db: AsyncSession, data: NotificationCreate) -> Notification:
    """Create a persistent user notification."""
    notif = Notification(
        title=data.title,
        message=data.message,
        severity=data.severity,
        vessel_name=data.vessel_name,
        action_url=data.action_url,
        is_read=False,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def list_notifications(
    db: AsyncSession, unread_only: bool = False, limit: int = 50
) -> Sequence[Notification]:
    """Retrieve notifications, ordered newest first."""
    await sync_notifications_from_vessels(db)

    stmt = select(Notification)
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)
    stmt = stmt.order_by(desc(Notification.created_at)).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def count_unread_notifications(db: AsyncSession) -> int:
    """Return count of unread notifications."""
    result = await db.execute(
        select(func.count(Notification.id)).where(Notification.is_read == False)
    )
    return result.scalar() or 0


async def mark_notification_read(db: AsyncSession, notif_id: int) -> Notification:
    """Mark a specific notification as read."""
    result = await db.execute(select(Notification).where(Notification.id == notif_id))
    notif = result.scalar_one_or_none()
    if notif is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification {notif_id} not found",
        )
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif


async def mark_all_notifications_read(db: AsyncSession) -> int:
    """Mark all notifications as read."""
    result = await db.execute(
        update(Notification).where(Notification.is_read == False).values(is_read=True)
    )
    await db.commit()
    return result.rowcount


async def delete_notification(db: AsyncSession, notif_id: int) -> None:
    """Delete a single notification."""
    result = await db.execute(select(Notification).where(Notification.id == notif_id))
    notif = result.scalar_one_or_none()
    if notif is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification {notif_id} not found",
        )
    await db.delete(notif)
    await db.commit()


async def clear_all_notifications(db: AsyncSession) -> int:
    """Clear all notifications."""
    result = await db.execute(select(Notification))
    count = len(result.scalars().all())
    await db.execute(delete(Notification))
    await db.commit()
    return count


async def sync_notifications_from_vessels(db: AsyncSession) -> None:
    """Ensure baseline notifications exist for delayed vessels if table is empty."""
    count_res = await db.execute(select(func.count(Notification.id)))
    if (count_res.scalar() or 0) > 0:
        return

    result = await db.execute(
        select(Vessel).where(Vessel.congestion_risk == "high").limit(3)
    )
    high_vessels = result.scalars().all()

    for v in high_vessels:
        notif = Notification(
            title=f"Congestion Risk Alert — {v.vessel_name}",
            message=f"{v.vessel_name} has high arrival congestion probability. Operational rescheduling recommended.",
            severity="warning",
            vessel_name=v.vessel_name,
            action_url="/operations",
            is_read=False,
        )
        db.add(notif)

    # Add welcome notification
    welcome = Notification(
        title="PortMind Command Center Active",
        message="Vessel tracking, ML ensemble predictor, and 72-hour operational plan are active.",
        severity="info",
        action_url="/",
        is_read=False,
    )
    db.add(welcome)
    await db.commit()
