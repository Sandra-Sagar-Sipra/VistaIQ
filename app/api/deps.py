from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.database.session import get_db_session
from app.repositories.postgres.monitoring_source_repository import MonitoringSourceRepository
from app.services.monitoring_source_service import MonitoringSourceService
from app.repositories.postgres.component_repository import ComponentRepository
from app.services.component_service import ComponentService


async def get_monitoring_source_service(
    session: AsyncSession = Depends(get_db_session),
) -> MonitoringSourceService:
    settings = get_settings()
    repository = MonitoringSourceRepository(session, settings.credentials_encryption_key)
    return MonitoringSourceService(repository)


async def get_component_service(
    session: AsyncSession = Depends(get_db_session),
) -> ComponentService:
    repository = ComponentRepository(session)
    return ComponentService(repository)
