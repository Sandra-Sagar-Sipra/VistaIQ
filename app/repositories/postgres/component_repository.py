import uuid
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.component import Component
from app.schemas.components.enums import ComponentType


class ComponentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_applications(
        self,
        *,
        limit: int,
        offset: int,
        search: Optional[str] = None,
    ) -> tuple[list[Component], int]:
        stmt = select(Component).where(
            Component.parent_id.is_(None),
            Component.component_type == ComponentType.APPLICATION.value
        )
        count_stmt = select(func.count()).select_from(Component).where(
            Component.parent_id.is_(None),
            Component.component_type == ComponentType.APPLICATION.value
        )

        if search:
            stmt = stmt.where(Component.name.ilike(f"%{search}%"))
            count_stmt = count_stmt.where(Component.name.ilike(f"%{search}%"))

        stmt = stmt.order_by(Component.created_at.desc()).limit(limit).offset(offset)

        total = (await self._session.execute(count_stmt)).scalar_one()
        items = (await self._session.execute(stmt)).scalars().all()
        return list(items), total

    async def get_by_id(self, component_id: uuid.UUID) -> Optional[Component]:
        return await self._session.get(Component, component_id)

    async def get_by_name_and_parent(self, name: str, parent_id: Optional[uuid.UUID] = None) -> Optional[Component]:
        stmt = select(Component).where(
            Component.name == name,
            Component.parent_id == parent_id
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def create(
        self,
        *,
        name: str,
        component_type: str,
        owner: Optional[str] = None,
        environment_id: Optional[uuid.UUID] = None,
        criticality: Optional[str] = None,
        status: str = "active",
        tags: list[str],
        metadata_: dict[str, Any],
        parent_id: Optional[uuid.UUID] = None,
    ) -> Component:
        component = Component(
            name=name,
            component_type=component_type,
            owner=owner,
            environment_id=environment_id,
            criticality=criticality,
            status=status,
            tags=tags,
            metadata_=metadata_,
            parent_id=parent_id,
        )
        self._session.add(component)
        await self._session.flush()
        await self._session.refresh(component)
        return component

    async def update(self, component: Component, changes: dict[str, Any]) -> Component:
        if "metadata" in changes:
            changes["metadata_"] = changes.pop("metadata")
            
        for field, value in changes.items():
            setattr(component, field, value)

        await self._session.flush()
        await self._session.refresh(component)
        return component

    async def delete(self, component: Component) -> None:
        await self._session.delete(component)
        await self._session.flush()
