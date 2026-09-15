from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"success": True, "service": "PortMind Backend", "status": "healthy"}
