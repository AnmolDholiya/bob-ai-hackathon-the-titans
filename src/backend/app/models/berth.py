from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.crane import Crane
    from app.models.port import Port


class Berth(Base):
    __tablename__ = "berths"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    berth_code: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    port_id: Mapped[int] = mapped_column(Integer, ForeignKey("ports.id", ondelete="CASCADE"), nullable=False)

    capacity_tons: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    max_vessel_length_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_vessel_draft_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # operational | maintenance | occupied
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="operational")

    available_from: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    available_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    port: Mapped["Port"] = relationship("Port", back_populates="berths")
    cranes: Mapped[List["Crane"]] = relationship(
        "Crane", back_populates="berth", cascade="all, delete-orphan"
    )
