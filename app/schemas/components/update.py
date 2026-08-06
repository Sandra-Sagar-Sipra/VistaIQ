from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.components.enums import Priority

class ApplicationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    owner: Optional[str] = Field(None, max_length=255)
    environment_id: Optional[UUID] = None
    criticality: Optional[Priority] = None
    status: Optional[str] = Field(None, max_length=255)
    tags: Optional[list[str]] = None
    metadata_: Optional[dict[str, Any]] = Field(None, alias="metadata")

    model_config = ConfigDict(populate_by_name=True)
