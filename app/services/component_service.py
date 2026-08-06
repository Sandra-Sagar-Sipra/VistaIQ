import uuid
from typing import Optional

from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ConflictError, NotFoundError
from app.models.component import Component
from app.repositories.postgres.component_repository import ComponentRepository
from app.schemas.components import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationUpdate,
    ComponentType,
)


class ComponentService:
    def __init__(self, repository: ComponentRepository) -> None:
        self._repository = repository

    async def list_applications(
        self,
        *,
        limit: int,
        offset: int,
        search: Optional[str] = None,
    ) -> ApplicationListResponse:
        rows, total = await self._repository.list_applications(
            limit=limit,
            offset=offset,
            search=search,
        )
        return ApplicationListResponse(
            items=[ApplicationResponse.model_validate(row) for row in rows],
            total=total,
        )

    async def get_application(self, application_id: uuid.UUID) -> ApplicationResponse:
        app = await self._get_or_404(application_id)
        if app.component_type != ComponentType.APPLICATION.value or app.parent_id is not None:
            raise NotFoundError("Application", application_id)
        return ApplicationResponse.model_validate(app)

    async def create_application(self, payload: ApplicationCreate) -> ApplicationResponse:
        if await self._repository.get_by_name_and_parent(payload.name, None) is not None:
            raise ConflictError(f"Application with name '{payload.name}' already exists")

        try:
            app = await self._repository.create(
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
        except IntegrityError as exc:
            raise ConflictError(f"Application with name '{payload.name}' already exists") from exc

        return ApplicationResponse.model_validate(app)

    async def update_application(
        self, application_id: uuid.UUID, payload: ApplicationUpdate
    ) -> ApplicationResponse:
        app = await self._get_or_404(application_id)
        if app.component_type != ComponentType.APPLICATION.value or app.parent_id is not None:
            raise NotFoundError("Application", application_id)

        changes = payload.model_dump(exclude_unset=True)

        if "name" in changes and changes["name"] != app.name:
            if await self._repository.get_by_name_and_parent(changes["name"], None) is not None:
                raise ConflictError(f"Application with name '{changes['name']}' already exists")

        if "criticality" in changes and changes["criticality"] is not None:
            changes["criticality"] = changes["criticality"].value

        try:
            updated = await self._repository.update(app, changes)
        except IntegrityError as exc:
            raise ConflictError(
                f"Application with name '{changes.get('name', app.name)}' already exists"
            ) from exc

        return ApplicationResponse.model_validate(updated)

    async def delete_application(self, application_id: uuid.UUID) -> None:
        app = await self._get_or_404(application_id)
        if app.component_type != ComponentType.APPLICATION.value or app.parent_id is not None:
            raise NotFoundError("Application", application_id)
            
        try:
            await self._repository.delete(app)
        except IntegrityError as exc:
            # Catching foreign key constraint failures (e.g. child components exist)
            raise ConflictError("Cannot delete application because it contains child components.") from exc

    async def _get_or_404(self, component_id: uuid.UUID) -> Component:
        component = await self._repository.get_by_id(component_id)
        if component is None:
            raise NotFoundError("Component", component_id)
        return component
