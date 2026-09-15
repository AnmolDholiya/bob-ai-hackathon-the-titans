from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.berth import Berth
    from app.models.port import Port


class Crane(Base):
    __tablename__ = "cranes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    crane_code: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    port_id: Mapped[int] = mapped_column(Integer, ForeignKey("ports.id", ondelete="CASCADE"), nullable=False)
    berth_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("berths.id", ondelete="SET NULL"), nullable=True
    )

    loading_rate_tons_per_hour: Mapped[float] = mapped_column(Float, nullable=False)
    unloading_rate_tons_per_hour: Mapped[float] = mapped_column(Float, nullable=False)

    # operational | maintenance | offline
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="operational")

    available_from: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    available_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    port: Mapped["Port"] = relationship("Port", back_populates="cranes")
    berth: Mapped[Optional["Berth"]] = relationship("Berth", back_populates="cranes")
