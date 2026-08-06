from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.components.enums import Priority

class ApplicationCreate(BaseModel):
    name: str = Field(..., max_length=255)
    owner: Optional[str] = Field(None, max_length=255)
    environment_id: Optional[UUID] = None
    criticality: Optional[Priority] = None
    status: str = Field(default="active", max_length=255)
    tags: list[str] = Field(default_factory=list)
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")

    model_config = ConfigDict(populate_by_name=True)
