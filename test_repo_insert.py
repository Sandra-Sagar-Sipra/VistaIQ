import asyncio
import json
import logging
from app.database.session import AsyncSessionLocal
from app.repositories.postgres.component_repository import ComponentRepository
from app.schemas.components.enums import ComponentType

logging.basicConfig(level=logging.INFO)

async def test_insert():
    async with AsyncSessionLocal() as session:
        repo = ComponentRepository(session)
        try:
            component = await repo.create(
                name="Test App via script",
                component_type=ComponentType.APPLICATION.value,
                owner="test",
                criticality="high",
                status="active",
                tags=[],
                metadata_={},
            )
            print("SUCCESS:", component.id)
            await session.commit()
        except Exception as e:
            print(f"FAILED WITH EXCEPTION: {type(e).__name__}")
            print(e)
            raise e

asyncio.run(test_insert())
