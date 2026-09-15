from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.ports import router as ports_router
from app.api.berths import router as berths_router
from app.api.cranes import router as cranes_router
from app.api.vessels import router as vessels_router
from app.api.predictions import router as predictions_router
from app.api.operations import router as operations_router
<<<<<<< HEAD
=======
from app.api.import_history import router as import_history_router
from app.api.profile import router as profile_router
from app.api.history import router as history_router
from app.api.alerts import router as alerts_router
from app.api.notifications import router as notifications_router
from app.api.reschedule import router as reschedule_router
from app.api.chat import router as chat_router
from app.api.reports import router as reports_router
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router, tags=["health"])
api_router.include_router(ports_router)
api_router.include_router(berths_router)
api_router.include_router(cranes_router)
api_router.include_router(vessels_router)
api_router.include_router(predictions_router)
api_router.include_router(operations_router)
<<<<<<< HEAD
=======
api_router.include_router(import_history_router)
api_router.include_router(profile_router)
api_router.include_router(history_router)
api_router.include_router(alerts_router)
api_router.include_router(notifications_router)
api_router.include_router(reschedule_router)
api_router.include_router(chat_router)
api_router.include_router(reports_router)
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
