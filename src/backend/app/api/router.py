from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.ports import router as ports_router
from app.api.berths import router as berths_router
from app.api.cranes import router as cranes_router
from app.api.vessels import router as vessels_router
from app.api.predictions import router as predictions_router
from app.api.operations import router as operations_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router, tags=["health"])
api_router.include_router(ports_router)
api_router.include_router(berths_router)
api_router.include_router(cranes_router)
api_router.include_router(vessels_router)
api_router.include_router(predictions_router)
api_router.include_router(operations_router)
