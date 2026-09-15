"""
Operations API — Operational Intelligence Layer.

GET /api/operations/routes   — alternate route recommendations (ML-driven)
GET /api/operations/berths   — berth assignment optimisation
GET /api/operations/cranes   — crane allocation
GET /api/operations/plan     — 72-hour operations plan

All congestion risk values come from the real XGBoost + LightGBM ensemble.
Berth/crane/routing decisions use deterministic business rules.
"""
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services import operations as ops_svc
from app.services.vessel import list_vessels

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/operations", tags=["operations"])


@router.get("/routes", summary="Alternate route recommendations for all vessels")
async def route_recommendations(db: AsyncSession = Depends(get_db)):
    vessels = await list_vessels(db)
    return await ops_svc.get_route_recommendations(db, vessels)


@router.get("/berths", summary="Berth assignment optimisation")
async def berth_assignments(db: AsyncSession = Depends(get_db)):
    vessels = await list_vessels(db)
    return await ops_svc.get_berth_assignments(db, vessels)


@router.get("/cranes", summary="Crane allocation by vessel priority")
async def crane_assignments(db: AsyncSession = Depends(get_db)):
    vessels = await list_vessels(db)
    return await ops_svc.get_crane_assignments(db, vessels)


@router.get("/plan", summary="72-hour port operations plan")
async def operations_plan(db: AsyncSession = Depends(get_db)):
    vessels = await list_vessels(db)
    return await ops_svc.get_72h_plan(db, vessels)
