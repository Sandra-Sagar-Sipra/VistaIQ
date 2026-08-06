from datetime import datetime
from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.components.enums import ComponentType, Priority

class ApplicationResponse(BaseModel):
    id: UUID
    name: str
    component_type: ComponentType
    owner: Optional[str] = None
    environment_id: Optional[UUID] = None
    criticality: Optional[Priority] = None
    status: str
    tags: list[str]
    metadata_: dict[str, Any] = Field(default_factory=dict, serialization_alias="metadata")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ApplicationListResponse(BaseModel):
    items: list[ApplicationResponse]
    total: int
