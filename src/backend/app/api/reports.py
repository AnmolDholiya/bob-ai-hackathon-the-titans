"""Reports & Live Analytics API — GET /api/reports/analytics, GET /api/reports/export"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.reports import ReportAnalyticsResponse
from app.services import reports as svc

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/analytics", response_model=ReportAnalyticsResponse, summary="Get live operational analytics")
async def get_analytics(db: AsyncSession = Depends(get_db)):
    """Computes real-time fleet, port, berth, crane, and alert analytics from the database."""
    return await svc.get_live_analytics(db)


@router.get("/export", summary="Export operational report data")
async def export_report(db: AsyncSession = Depends(get_db)):
    """Generate exportable payload of current operational metrics."""
    data = await svc.get_live_analytics(db)
    return {
        "report_title": "PortMind Operational Summary",
        "exported_at": data.generated_at.isoformat(),
        "summary": data.model_dump(),
    }
