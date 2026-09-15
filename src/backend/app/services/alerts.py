"""Service layer for Operational Alerts."""
from typing import Optional, Sequence

from fastapi import HTTPException, status
from sqlalchemy import delete, desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert
from app.models.vessel import Vessel
from app.schemas.alert import AlertCreate


async def create_alert(db: AsyncSession, data: AlertCreate) -> Alert:
    """Create a new system/operational alert."""
    alert = Alert(
        severity=data.severity,
        title=data.title,
        description=data.description,
        status=data.status,
        vessel_id=data.vessel_id,
        vessel_name=data.vessel_name,
        port_code=data.port_code,
        is_read=False,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


async def list_alerts(
    db: AsyncSession,
    severity: Optional[str] = None,
    alert_status: Optional[str] = None,
    is_read: Optional[bool] = None,
    limit: int = 100,
) -> Sequence[Alert]:
    """Query alerts with severity and status filters."""
    # Run sync check to ensure high-risk vessels have alerts
    await sync_vessel_alerts(db)

    stmt = select(Alert)
    if severity and severity != "All":
        stmt = stmt.where(Alert.severity == severity)
    if alert_status and alert_status != "All":
        stmt = stmt.where(Alert.status == alert_status)
    if is_read is not None:
        stmt = stmt.where(Alert.is_read == is_read)

    stmt = stmt.order_by(desc(Alert.created_at)).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def mark_alert_read(db: AsyncSession, alert_id: int) -> Alert:
    """Mark an individual alert as read."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert {alert_id} not found"
        )
    alert.is_read = True
    await db.commit()
    await db.refresh(alert)
    return alert


async def mark_all_alerts_read(db: AsyncSession) -> int:
    """Mark all active alerts as read."""
    result = await db.execute(
        update(Alert).where(Alert.is_read == False).values(is_read=True)
    )
    await db.commit()
    return result.rowcount


async def delete_alert(db: AsyncSession, alert_id: int) -> None:
    """Delete a single alert."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert {alert_id} not found"
        )
    await db.delete(alert)
    await db.commit()


async def clear_all_alerts(db: AsyncSession) -> int:
    """Remove all alerts."""
    result = await db.execute(select(Alert))
    count = len(result.scalars().all())
    await db.execute(delete(Alert))
    await db.commit()
    return count


async def sync_vessel_alerts(db: AsyncSession) -> None:
    """Generate real alerts for high-risk vessels in the database if not already present."""
    result = await db.execute(
        select(Vessel).where((Vessel.congestion_risk == "high") | (Vessel.delay_hours >= 3.0))
    )
    vessels = result.scalars().all()

    for v in vessels:
        # Check if an alert already exists for this vessel
        existing = await db.execute(
            select(Alert).where(Alert.vessel_name == v.vessel_name, Alert.status == "Active")
        )
        if not existing.scalar_one_or_none():
            sev = "Critical" if (v.delay_hours and v.delay_hours >= 5.0) else "High"
            alert = Alert(
                severity=sev,
                title=f"High Congestion Risk — {v.vessel_name}",
                description=(
                    f"Vessel {v.vessel_name} (IMO: {v.imo_number}) heading to {v.arrival_port_code or 'port'} "
                    f"has an estimated delay of {v.delay_hours or 0.0:.1f}h and elevated congestion risk."
                ),
                status="Active",
                vessel_id=v.id,
                vessel_name=v.vessel_name,
                port_code=v.arrival_port_code,
                is_read=False,
            )
            db.add(alert)

    await db.commit()
