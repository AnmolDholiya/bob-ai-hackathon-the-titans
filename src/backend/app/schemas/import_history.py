from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ImportHistoryCreate(BaseModel):
    filename:      str = Field(..., min_length=1, max_length=255)
    total_rows:    int = Field(..., ge=0)
    imported_rows: int = Field(..., ge=0)
    skipped_rows:  int = Field(..., ge=0)
    status:        str = Field(..., pattern=r"^(success|partial|error)$")
    # List of {lineNum, imo, reason} dicts — serialised to JSON text in the DB
    skip_details: Optional[List[Any]] = None


class ImportHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:            int
    filename:      str
    imported_at:   datetime
    total_rows:    int
    imported_rows: int
    skipped_rows:  int
    status:        str
    skip_details:  Optional[str] = None
