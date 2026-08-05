import uuid
from typing import Optional

from sqlalchemy.exc import IntegrityError

from app.adapters.registry import get_adapter
from app.core.exceptions import ConflictError, InvalidStateError, NotFoundError
from app.models.monitoring_source import MonitoringSource
from app.repositories.postgres.monitoring_source_repository import MonitoringSourceRepository
from app.schemas.monitoring_source import (
    IngestionMode,
    MonitoringSourceCreate,
    MonitoringSourceListResponse,
    MonitoringSourceResponse,
    MonitoringSourceUpdate,
    SourceType,
    SyncTriggerResponse,
    TestConnectionResponse,
)


class MonitoringSourceService:
    def __init__(self, repository: MonitoringSourceRepository) -> None:
        self._repository = repository

    async def list_sources(
        self,
        *,
        limit: int,
        offset: int,
        search: Optional[str],
        vendor: Optional[str],
        source_type: Optional[SourceType],
        ingestion_mode: Optional[IngestionMode],
        is_enabled: Optional[bool],
    ) -> MonitoringSourceListResponse:
        rows, total = await self._repository.list(
            limit=limit,
            offset=offset,
            search=search,
            vendor=vendor,
            source_type=source_type.value if source_type else None,
            ingestion_mode=ingestion_mode.value if ingestion_mode else None,
            is_enabled=is_enabled,
        )
        return MonitoringSourceListResponse(
            items=[MonitoringSourceResponse.model_validate(row) for row in rows],
            total=total,
        )

    async def get_source(self, source_id: uuid.UUID) -> MonitoringSourceResponse:
        source = await self._get_or_404(source_id)
        return MonitoringSourceResponse.model_validate(source)

    async def create_source(self, payload: MonitoringSourceCreate) -> MonitoringSourceResponse:
        if await self._repository.get_by_name(payload.name) is not None:
            raise ConflictError(f"Monitoring source with name '{payload.name}' already exists")

        try:
            source = await self._repository.create(
                name=payload.name,
                source_type=payload.source_type.value,
                vendor=payload.vendor,
                base_url=str(payload.base_url),
                auth_method=payload.auth_method.value,
                credentials=payload.credentials,
                ingestion_mode=payload.ingestion_mode.value,
                poll_interval_seconds=payload.poll_interval_seconds,
                webhook_secret=payload.webhook_secret,
                is_enabled=payload.is_enabled,
            )
        except IntegrityError as exc:
            raise ConflictError(f"Monitoring source with name '{payload.name}' already exists") from exc

        return MonitoringSourceResponse.model_validate(source)

    async def update_source(
        self, source_id: uuid.UUID, payload: MonitoringSourceUpdate
    ) -> MonitoringSourceResponse:
        source = await self._get_or_404(source_id)
        changes = payload.model_dump(exclude_unset=True)

        if "name" in changes and changes["name"] != source.name:
            if await self._repository.get_by_name(changes["name"]) is not None:
                raise ConflictError(f"Monitoring source with name '{changes['name']}' already exists")

        self._validate_ingestion_invariants(source, changes)

        for enum_field in ("source_type", "auth_method", "ingestion_mode"):
            if changes.get(enum_field) is not None:
                changes[enum_field] = changes[enum_field].value
        if changes.get("base_url") is not None:
            changes["base_url"] = str(changes["base_url"])

        try:
            updated = await self._repository.update(source, changes)
        except IntegrityError as exc:
            raise ConflictError(
                f"Monitoring source with name '{changes.get('name', source.name)}' already exists"
            ) from exc

        return MonitoringSourceResponse.model_validate(updated)

    async def delete_source(self, source_id: uuid.UUID) -> None:
        source = await self._get_or_404(source_id)
        await self._repository.delete(source)

    async def test_connection(self, source_id: uuid.UUID) -> TestConnectionResponse:
        source = await self._get_or_404(source_id)
        credentials = await self._repository.get_decrypted_credentials(source)

        adapter = get_adapter(source.vendor)
        result = await adapter.test_connection(
            base_url=source.base_url,
            auth_method=source.auth_method,
            credentials=credentials,
        )

        await self._repository.update_connection_result(
            source,
            connection_status="connected" if result.success else "failed",
            last_sync_error=None if result.success else result.message,
        )

        return TestConnectionResponse(
            success=result.success, message=result.message, latency_ms=result.latency_ms
        )

    async def trigger_sync(self, source_id: uuid.UUID) -> SyncTriggerResponse:
        await self._get_or_404(source_id)
        # Actual enqueue/dispatch is owned by app.ingestion, which is built out
        # separately; this reserves a run id and reports it as queued.
        return SyncTriggerResponse(sync_run_id=uuid.uuid4(), status="queued")

    @staticmethod
    def _validate_ingestion_invariants(source: MonitoringSource, changes: dict) -> None:
        effective_mode = changes.get("ingestion_mode", IngestionMode(source.ingestion_mode))
        if isinstance(effective_mode, IngestionMode):
            effective_mode = effective_mode.value

        effective_poll_interval = changes.get("poll_interval_seconds", source.poll_interval_seconds)
        effective_webhook_secret = changes.get("webhook_secret", source.webhook_secret)

        if effective_mode == IngestionMode.POLL.value and effective_poll_interval is None:
            raise InvalidStateError("poll_interval_seconds is required when ingestion_mode is 'poll'")
        if effective_mode == IngestionMode.WEBHOOK.value and not effective_webhook_secret:
            raise InvalidStateError("webhook_secret is required when ingestion_mode is 'webhook'")

    async def _get_or_404(self, source_id: uuid.UUID) -> MonitoringSource:
        source = await self._repository.get_by_id(source_id)
        if source is None:
            raise NotFoundError("Monitoring source", source_id)
        return source
