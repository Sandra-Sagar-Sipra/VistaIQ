from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_component_service
from app.core.exceptions import ConflictError, NotFoundError
from app.schemas.components import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.services.component_service import ComponentService

router = APIRouter(prefix="/api/v1/applications", tags=["Applications"])


@router.get(
    "",
    response_model=ApplicationListResponse,
    status_code=status.HTTP_200_OK,
    summary="List applications",
    description="Returns a paginated, filterable list of applications.",
)
async def list_applications(
    limit: int = Query(default=20, ge=1, le=100, description="Max number of items to return"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    search: str | None = Query(default=None, description="Case-insensitive search on name"),
    service: ComponentService = Depends(get_component_service),
) -> ApplicationListResponse:
    return await service.list_applications(
        limit=limit,
        offset=offset,
        search=search,
    )


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get an application",
    responses={status.HTTP_404_NOT_FOUND: {"description": "Application not found"}},
)
async def get_application(
    application_id: UUID,
    service: ComponentService = Depends(get_component_service),
) -> ApplicationResponse:
    try:
        return await service.get_application(application_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an application",
    responses={status.HTTP_409_CONFLICT: {"description": "An application with this name already exists"}},
)
async def create_application(
    payload: ApplicationCreate,
    service: ComponentService = Depends(get_component_service),
) -> ApplicationResponse:
    try:
        return await service.create_application(payload)
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.patch(
    "/{application_id}",
    response_model=ApplicationResponse,
    status_code=status.HTTP_200_OK,
    summary="Partially update an application",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Application not found"},
        status.HTTP_409_CONFLICT: {"description": "An application with this name already exists"},
    },
)
async def update_application(
    application_id: UUID,
    payload: ApplicationUpdate,
    service: ComponentService = Depends(get_component_service),
) -> ApplicationResponse:
    try:
        return await service.update_application(application_id, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an application",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Application not found"},
        status.HTTP_409_CONFLICT: {"description": "Cannot delete application because it contains child components"},
    },
)
async def delete_application(
    application_id: UUID,
    service: ComponentService = Depends(get_component_service),
) -> None:
    try:
        await service.delete_application(application_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
