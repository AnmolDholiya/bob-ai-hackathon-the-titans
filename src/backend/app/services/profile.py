"""Operator Profile Service with secure PBKDF2 password hashing."""
import hashlib
import os
import secrets
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.operator_profile import OperatorProfile
from app.schemas.profile import ChangePasswordRequest, ProfileUpdate


def hash_password(password: str) -> str:
    """Generate salted PBKDF2-HMAC-SHA256 password hash."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify password against stored salt$hash."""
    try:
        salt, key_hex = stored_hash.split("$", 1)
        expected_key = hashlib.pbkdf2_hmac(
            "sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000
        )
        return secrets.compare_digest(expected_key.hex(), key_hex)
    except Exception:
        return False


async def get_or_create_profile(db: AsyncSession) -> OperatorProfile:
    """Retrieve singleton operator profile or initialize default."""
    result = await db.execute(select(OperatorProfile).limit(1))
    profile = result.scalar_one_or_none()

    if profile is None:
        default_pwd_hash = hash_password("portmind2026")
        profile = OperatorProfile(
            full_name="Captain Alex Vance",
            email="operator@portmind.io",
            mobile="+1 (555) 019-2834",
            role="Senior Port Controller",
            password_hash=default_pwd_hash,
            language="en",
            notify_email=True,
            notify_browser=True,
            notify_high_risk=True,
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


async def update_profile(db: AsyncSession, data: ProfileUpdate) -> OperatorProfile:
    """Update profile fields."""
    profile = await get_or_create_profile(db)
    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


async def change_password(db: AsyncSession, data: ChangePasswordRequest) -> None:
    """Validate current password and securely update to new password."""
    profile = await get_or_create_profile(db)

    if not verify_password(data.current_password, profile.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match.",
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long.",
        )

    profile.password_hash = hash_password(data.new_password)
    await db.commit()
