import asyncio
import json
import logging
from typing import Any, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.database.session import AsyncSessionLocal
from app.repositories.postgres.component_repository import ComponentRepository
from app.services.component_service import ComponentService
from app.schemas.components import ApplicationCreate
from app.schemas.components.enums import ComponentType, Priority
from pydantic import ValidationError

logging.basicConfig(level=logging.INFO)

class TestApplicationResponse(BaseModel):
    id: UUID
    name: str
    component_type: ComponentType
    owner: Optional[str] = None
    environment_id: Optional[UUID] = None
    criticality: Optional[Priority] = None
    status: str
    tags: list[str]
    # CHANGED: alias to serialization_alias
    metadata_: dict[str, Any] = Field(default_factory=dict, serialization_alias="metadata")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

async def test_service():
    async with AsyncSessionLocal() as session:
        repo = ComponentRepository(session)
        service = ComponentService(repo)
        
        payload = ApplicationCreate(
            name="Test App via service 2",
            owner="test",
            criticality="high",
            status="active"
        )
        
        try:
            app = await repo.create(
                name=payload.name,
                component_type=ComponentType.APPLICATION.value,
                owner=payload.owner,
                environment_id=payload.environment_id,
                criticality=payload.criticality.value if payload.criticality else None,
                status=payload.status,
                tags=payload.tags,
                metadata_=payload.metadata_,
                parent_id=None,
            )
            resp = TestApplicationResponse.model_validate(app)
            print("SUCCESS:", resp.id)
            print("SERIALIZED:", resp.model_dump(by_alias=True))
            await session.rollback()
        except ValidationError as e:
            print("PYDANTIC VALIDATION ERROR:")
            print(e)
        except Exception as e:
            print(f"FAILED WITH EXCEPTION: {type(e).__name__}")
            print(e)
            raise e

asyncio.run(test_service())
