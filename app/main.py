import uuid

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api_router import api_router
from app.core.config import get_settings
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    IdentityProviderError,
    InvalidStateError,
    NotFoundError,
)
from app.core.logging import configure_logging

settings = get_settings()
configure_logging(settings.log_level)

logger = structlog.get_logger(__name__)

app = FastAPI(
    title="VistaIQ",
    version="0.1.0",
    description="VistaIQ monitoring, security, and DevOps observability platform.",
)

# Installed only when explicitly configured. In development the Vite dev
# server proxies /api to this process, so the browser treats the API as
# same-origin and no CORS headers are needed.
if settings.cors_allowed_origin_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def request_context(request: Request, call_next):
    """Give every request a correlation identifier (WBS task 1.4).

    Contexts are cleared at the start rather than the end: a handler that
    raises would otherwise leave its bindings behind for whatever the worker
    picks up next, and identity from one user could be logged against
    another's request.
    """
    structlog.contextvars.clear_contextvars()
    correlation_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    structlog.contextvars.bind_contextvars(
        correlation_id=correlation_id,
        method=request.method,
        path=request.url.path,
    )

    response = await call_next(request)
    response.headers["X-Request-ID"] = correlation_id
    return response


def _error_response(status_code: int, message: str, headers: dict[str, str] | None = None) -> JSONResponse:
    # Matches the shape the existing routers produce via HTTPException, so
    # clients have one error contract to handle.
    return JSONResponse(status_code=status_code, content={"detail": message}, headers=headers)


@app.exception_handler(AuthenticationError)
async def handle_authentication_error(_: Request, exc: AuthenticationError) -> JSONResponse:
    # RFC 6750 expects a challenge on a 401 so clients know how to retry.
    return _error_response(
        status.HTTP_401_UNAUTHORIZED, str(exc), headers={"WWW-Authenticate": "Bearer"}
    )


@app.exception_handler(AuthorizationError)
async def handle_authorization_error(_: Request, exc: AuthorizationError) -> JSONResponse:
    return _error_response(status.HTTP_403_FORBIDDEN, str(exc))


@app.exception_handler(IdentityProviderError)
async def handle_identity_provider_error(_: Request, exc: IdentityProviderError) -> JSONResponse:
    # Not a 401. The token was never checked, so telling the client to sign
    # in again would send it into a pointless loop during a Microsoft outage.
    logger.error("identity_provider_unavailable", error=str(exc))
    return _error_response(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc))


@app.exception_handler(NotFoundError)
async def handle_not_found_error(_: Request, exc: NotFoundError) -> JSONResponse:
    return _error_response(status.HTTP_404_NOT_FOUND, str(exc))


@app.exception_handler(ConflictError)
async def handle_conflict_error(_: Request, exc: ConflictError) -> JSONResponse:
    return _error_response(status.HTTP_409_CONFLICT, str(exc))


@app.exception_handler(InvalidStateError)
async def handle_invalid_state_error(_: Request, exc: InvalidStateError) -> JSONResponse:
    return _error_response(status.HTTP_400_BAD_REQUEST, str(exc))


app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "environment": settings.environment,
        # Enough to diagnose a misconfigured sign-in without exposing
        # anything sensitive. No identifiers, no secrets -- only whether the
        # pieces are present and which mode is active.
        "auth": {
            "mode": "bypass" if settings.auth_bypass_enabled else "entra",
            "client_id_configured": bool(settings.entra_client_id),
            "allowed_tenant_count": len(settings.allowed_tenant_id_set),
            "rbac_enabled": settings.rbac_enabled,
        },
    }
