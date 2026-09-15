"""SQLAlchemy ORM model for Vessel."""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Vessel(Base):
    __tablename__ = "vessels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Identity
    imo_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    vessel_name: Mapped[str] = mapped_column(String(120), nullable=False)
    vessel_type: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)  # container, bulk, tanker…
    flag_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)    # ISO 3166-1 alpha-2

    # Physical
    length_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    draft_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gross_tonnage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Current operational state
    # active | en_route | berthed | delayed | inactive
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")

    current_location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    speed_knots: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Route
    departure_port_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    arrival_port_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    scheduled_eta: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    predicted_eta: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Delay tracking
    delay_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=0.0)
    # low | medium | high
    congestion_risk: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="low")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
