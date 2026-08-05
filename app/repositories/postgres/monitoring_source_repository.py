import json
import uuid
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.monitoring_source import MonitoringSource


class MonitoringSourceRepository:
    def __init__(self, session: AsyncSession, encryption_key: str) -> None:
        self._session = session
        self._encryption_key = encryption_key

    async def list(
        self,
        *,
        limit: int,
        offset: int,
        search: Optional[str],
        vendor: Optional[str],
        source_type: Optional[str],
        ingestion_mode: Optional[str],
        is_enabled: Optional[bool],
    ) -> tuple[list[MonitoringSource], int]:
        stmt = select(MonitoringSource)
        count_stmt = select(func.count()).select_from(MonitoringSource)

        if search:
            stmt = stmt.where(MonitoringSource.name.ilike(f"%{search}%"))
            count_stmt = count_stmt.where(MonitoringSource.name.ilike(f"%{search}%"))
        if vendor:
            stmt = stmt.where(MonitoringSource.vendor == vendor)
            count_stmt = count_stmt.where(MonitoringSource.vendor == vendor)
        if source_type:
            stmt = stmt.where(MonitoringSource.source_type == source_type)
            count_stmt = count_stmt.where(MonitoringSource.source_type == source_type)
        if ingestion_mode:
            stmt = stmt.where(MonitoringSource.ingestion_mode == ingestion_mode)
            count_stmt = count_stmt.where(MonitoringSource.ingestion_mode == ingestion_mode)
        if is_enabled is not None:
            stmt = stmt.where(MonitoringSource.is_enabled == is_enabled)
            count_stmt = count_stmt.where(MonitoringSource.is_enabled == is_enabled)

        stmt = stmt.order_by(MonitoringSource.created_at.desc()).limit(limit).offset(offset)

        total = (await self._session.execute(count_stmt)).scalar_one()
        items = (await self._session.execute(stmt)).scalars().all()
        return list(items), total

    async def get_by_id(self, source_id: uuid.UUID) -> Optional[MonitoringSource]:
        return await self._session.get(MonitoringSource, source_id)

    async def get_by_name(self, name: str) -> Optional[MonitoringSource]:
        stmt = select(MonitoringSource).where(MonitoringSource.name == name)
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def create(
        self,
        *,
        name: str,
        source_type: str,
        vendor: str,
        base_url: str,
        auth_method: str,
        credentials: dict[str, Any],
        ingestion_mode: str,
        poll_interval_seconds: Optional[int],
        webhook_secret: Optional[str],
        is_enabled: bool,
    ) -> MonitoringSource:
        source = MonitoringSource(
            name=name,
            source_type=source_type,
            vendor=vendor,
            base_url=base_url,
            auth_method=auth_method,
            credentials=await self._encrypt(json.dumps(credentials)),
            ingestion_mode=ingestion_mode,
            poll_interval_seconds=poll_interval_seconds,
            webhook_secret=await self._encrypt(webhook_secret) if webhook_secret else None,
            is_enabled=is_enabled,
        )
        self._session.add(source)
        await self._session.flush()
        await self._session.refresh(source)
        return source

    async def update(self, source: MonitoringSource, changes: dict[str, Any]) -> MonitoringSource:
        if changes.get("credentials") is not None:
            changes["credentials"] = await self._encrypt(json.dumps(changes["credentials"]))
        if changes.get("webhook_secret") is not None:
            changes["webhook_secret"] = await self._encrypt(changes["webhook_secret"])

        for field, value in changes.items():
            setattr(source, field, value)

        await self._session.flush()
        await self._session.refresh(source)
        return source

    async def delete(self, source: MonitoringSource) -> None:
        await self._session.delete(source)
        await self._session.flush()

    async def get_decrypted_credentials(self, source: MonitoringSource) -> dict[str, Any]:
        decrypted = await self._decrypt(source.credentials)
        return json.loads(decrypted)

    async def update_connection_result(
        self,
        source: MonitoringSource,
        *,
        connection_status: str,
        last_sync_error: Optional[str],
    ) -> MonitoringSource:
        source.connection_status = connection_status
        source.last_sync_error = last_sync_error
        await self._session.flush()
        await self._session.refresh(source)
        return source

    async def _encrypt(self, plaintext: str) -> bytes:
        stmt = select(func.pgp_sym_encrypt(plaintext, self._encryption_key))
        return (await self._session.execute(stmt)).scalar_one()

    async def _decrypt(self, ciphertext: bytes) -> str:
        stmt = select(func.pgp_sym_decrypt(ciphertext, self._encryption_key))
        return (await self._session.execute(stmt)).scalar_one()
