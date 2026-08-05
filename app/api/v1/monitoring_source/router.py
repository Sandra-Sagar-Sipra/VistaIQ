from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_monitoring_source_service
from app.auth.dependencies import get_current_user
from app.core.exceptions import ConflictError, InvalidStateError, NotFoundError
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
from app.services.monitoring_source_service import MonitoringSourceService

# Applied at the router rather than per route, so a new endpoint added here
# is authenticated by default. Securing endpoints one decorator at a time
# means the one someone forgets is the one that leaks.
router = APIRouter(
    prefix="/api/v1/sources",
    tags=["Monitoring Sources"],
    dependencies=[Depends(get_current_user)],
    responses={status.HTTP_401_UNAUTHORIZED: {"description": "Missing, expired or invalid token"}},
)


@router.get(
    "",
    response_model=MonitoringSourceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List monitoring sources",
    description="Returns a paginated, filterable list of monitoring sources. "
    "Sensitive fields (credentials, webhook_secret) are never included.",
)
async def list_sources(
    limit: int = Query(default=20, ge=1, le=100, description="Max number of items to return"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    search: str | None = Query(default=None, description="Case-insensitive search on name"),
    vendor: str | None = Query(default=None, description="Filter by exact vendor"),
    source_type: SourceType | None = Query(default=None, description="Filter by source_type"),
    ingestion_mode: IngestionMode | None = Query(default=None, description="Filter by ingestion_mode"),
    is_enabled: bool | None = Query(default=None, description="Filter by enabled status"),
    service: MonitoringSourceService = Depends(get_monitoring_source_service),
) -> MonitoringSourceListResponse:
    return await service.list_sources(
        limit=limit,
        offset=offset,
        search=search,
        vendor=vendor,
        source_type=source_type,
        ingestion_mode=ingestion_mode,
        is_enabled=is_enabled,
    )


@router.get(
    "/{source_id}",
    response_model=MonitoringSourceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a monitoring source",
    responses={status.HTTP_404_NOT_FOUND: {"description": "Monitoring source not found"}},
)
async def get_source(
    source_id: UUID,
    service: MonitoringSourceService = Depends(get_monitoring_source_service),
) -> MonitoringSourceResponse:
    try:
        return await service.get_source(source_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "",
    response_model=MonitoringSourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a monitoring source",
    responses={status.HTTP_409_CONFLICT: {"description": "A source with this name already exists"}},
)
async def create_source(
    payload: MonitoringSourceCreate,
    service: MonitoringSourceService = Depends(get_monitoring_source_service),
) -> MonitoringSourceResponse:
    try:
        return await service.create_source(payload)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.patch(
    "/{source_id}",
    response_model=MonitoringSourceResponse,
    status_code=status.HTTP_200_OK,
    summary="Partially update a monitoring source",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Monitoring source not found"},
        status.HTTP_409_CONFLICT: {"description": "A source with this name already exists"},
        status.HTTP_400_BAD_REQUEST: {"description": "Invalid ingestion_mode configuration"},
    },
)
async def update_source(
    source_id: UUID,
    payload: MonitoringSourceUpdate,
    service: MonitoringSourceService = Depends(get_monitoring_source_service),
) -> MonitoringSourceResponse:
    try:
        return await service.update_source(source_id, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete(
    "/{source_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a monitoring source",
    responses={status.HTTP_404_NOT_FOUND: {"description": "Monitoring source not found"}},
)
async def delete_source(
    source_id: UUID,
    service: MonitoringSourceService = Depends(get_monitoring_source_service),
) -> None:
    try:
        await service.delete_source(source_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/{source_id}/test-connection",
    response_model=TestConnectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Test connectivity to the configured monitoring source",
    description="Invokes the vendor adapter to verify connectivity and updates "
    "connection_status / last_sync_error. Does not trigger ingestion.",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Monitoring source not found"},
        status.HTTP_501_NOT_IMPLEMENTED: {"description": "No adapter implemented for this vendor yet"},
    },
)
async def test_connection(
    source_id: UUID,
    service: MonitoringSourceService = Depends(get_monitoring_source_service),
) -> TestConnectionResponse:
    try:
        return await service.test_connection(source_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except NotImplementedError as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)) from exc


@router.post(
    "/{source_id}/sync",
    response_model=SyncTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger an immediate ingestion run",
    description="Enqueues an ingestion run and returns immediately without waiting for completion.",
    responses={status.HTTP_404_NOT_FOUND: {"description": "Monitoring source not found"}},
)
async def sync_source(
    source_id: UUID,
    service: MonitoringSourceService = Depends(get_monitoring_source_service),
) -> SyncTriggerResponse:
    try:
        return await service.trigger_sync(source_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
