from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.berth import Berth
    from app.models.crane import Crane


class Port(Base):
    __tablename__ = "ports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    port_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    port_name: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Cargo capacity (tons/day)
    max_daily_capacity_tons: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    current_cargo_tons: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Yard capacity (tons)
    yard_capacity_tons: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    current_yard_load_tons: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Vessel limits
    max_vessel_length_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_vessel_draft_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_vessel_weight_tons: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    berths: Mapped[List["Berth"]] = relationship(
        "Berth", back_populates="port", cascade="all, delete-orphan"
    )
    cranes: Mapped[List["Crane"]] = relationship(
        "Crane", back_populates="port", cascade="all, delete-orphan"
    )
