"""Pydantic schemas for OperatorProfile."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProfileRead(BaseModel):
    id: int
    full_name: str
    email: str
    mobile: str
    role: str
    avatar_url: Optional[str] = None
    language: str
    notify_email: bool
    notify_browser: bool
    notify_high_risk: bool
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=120)
    email: Optional[str] = Field(None, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    mobile: Optional[str] = Field(None, min_length=5, max_length=40)
    role: Optional[str] = Field(None, min_length=2, max_length=80)
    avatar_url: Optional[str] = None
    language: Optional[str] = Field(None, pattern="^(en|gu|hi)$")
    notify_email: Optional[bool] = None
    notify_browser: Optional[bool] = None
    notify_high_risk: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=4)
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class PasswordChangeResponse(BaseModel):
    success: bool
    message: str
