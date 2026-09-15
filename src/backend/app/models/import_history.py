from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ImportHistory(Base):
    """Persists a summary record for every CSV import attempt."""

    __tablename__ = "import_history"

    id: Mapped[int]          = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str]    = mapped_column(String(255), nullable=False)
    imported_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    total_rows:    Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    imported_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    skipped_rows:  Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # success | partial | error
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="success"
    )

    # Optional JSON-serialised list of skip reasons (stored as text)
    skip_details: Mapped[str | None] = mapped_column(Text, nullable=True)
