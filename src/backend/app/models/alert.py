"""SQLAlchemy ORM model for System and Operational Alerts."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    severity: Mapped[str] = mapped_column(String(30), nullable=False, default="Medium")  # Critical | High | Medium | Informational
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Active")  # Active | Acknowledged | Resolved

    vessel_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    vessel_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    port_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
