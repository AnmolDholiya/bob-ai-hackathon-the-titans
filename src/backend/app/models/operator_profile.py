"""SQLAlchemy ORM model for OperatorProfile."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class OperatorProfile(Base):
    __tablename__ = "operator_profile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False, default="Port Operator")
    email: Mapped[str] = mapped_column(String(120), nullable=False, default="operator@portmind.io")
    mobile: Mapped[str] = mapped_column(String(40), nullable=False, default="+1 (555) 019-2834")
    role: Mapped[str] = mapped_column(String(80), nullable=False, default="Senior Port Controller")
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Salted hash using PBKDF2
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Preferences
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    notify_email: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_browser: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_high_risk: Mapped[bool] = mapped_column(Boolean, default=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
