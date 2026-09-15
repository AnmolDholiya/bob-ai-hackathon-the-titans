"""Profile API routes — GET /api/profile, PUT /api/profile, POST /api/profile/change-password"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.profile import (
    ChangePasswordRequest,
    PasswordChangeResponse,
    ProfileRead,
    ProfileUpdate,
)
from app.services import profile as svc

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileRead, summary="Get operator profile")
async def get_profile(db: AsyncSession = Depends(get_db)):
    return await svc.get_or_create_profile(db)


@router.put("", response_model=ProfileRead, summary="Update operator profile")
async def update_profile(data: ProfileUpdate, db: AsyncSession = Depends(get_db)):
    return await svc.update_profile(db, data)


@router.post(
    "/change-password",
    response_model=PasswordChangeResponse,
    summary="Securely change operator password",
)
async def change_password(data: ChangePasswordRequest, db: AsyncSession = Depends(get_db)):
    await svc.change_password(db, data)
    return PasswordChangeResponse(success=True, message="Password updated successfully.")
