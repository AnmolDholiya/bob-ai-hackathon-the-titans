"""SQLAlchemy ORM model for Audit Event History."""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class History(Base):
    __tablename__ = "history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    event_type: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    # csv_import | vessel_create | vessel_update | prediction_generated | reschedule_proposed | reschedule_approved | reschedule_rejected | berth_assigned | crane_assigned | plan_generated | report_generated

    vessel_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    vessel_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="success")  # success | warning | error | info
    user_action: Mapped[Optional[str]] = mapped_column(String(80), nullable=True, default="System")
    details_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
