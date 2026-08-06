"""FastAPI dependencies that turn a request into an authenticated user.

Two layers are exposed deliberately:

``get_current_claims``  verified token claims, no database access. Use where
                        identity is needed but a user row is not.
``get_current_user``    the ``app_user`` row, provisioned on first sight.
                        This is what endpoints normally want.
"""

from __future__ import annotations

import structlog
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import JwksCache, TokenClaims, TokenValidator, bypass_claims
from app.core.config import Settings, get_settings
from app.core.exceptions import AuthenticationError
from app.database.session import get_db_session
from app.models.user import AppUser
from app.repositories.postgres.user_repository import UserRepository
from app.services.auth_service import AuthService

logger = structlog.get_logger(__name__)

# auto_error=False so a missing header raises our own AuthenticationError and
# gets the standard error shape, rather than FastAPI's default 403 body.
_bearer_scheme = HTTPBearer(auto_error=False, description="Entra ID access token")

# One cache for the process. Created at import so signing keys survive across
# requests; a per-request cache would defeat the point and hammer Microsoft.
_jwks_cache = JwksCache()


def get_jwks_cache() -> JwksCache:
    return _jwks_cache


def get_token_validator(
    settings: Settings = Depends(get_settings),
    cache: JwksCache = Depends(get_jwks_cache),
) -> TokenValidator:
    return TokenValidator(settings, cache)


async def get_current_claims(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
    validator: TokenValidator = Depends(get_token_validator),
) -> TokenClaims:
    # WBS task 3.4. Settings refuses to start with this enabled outside a
    # development environment, so reaching here in production is impossible
    # by construction rather than by discipline.
    if settings.auth_bypass_enabled:
        claims = bypass_claims(settings)
        logger.debug("auth_bypass_used", email=claims.email, path=request.url.path)
        return claims

    # HTTPBearer yields None both when the header is absent and when it uses
    # another scheme, so this one branch covers both. An explicit scheme check
    # after it would be unreachable.
    if credentials is None or not credentials.credentials:
        raise AuthenticationError("Missing bearer token.")

    claims = await validator.validate(credentials.credentials)

    # Bind identity to the log context so every line emitted while handling
    # this request carries who made it, without threading it through calls.
    structlog.contextvars.bind_contextvars(
        user_object_id=claims.object_id,
        tenant_id=claims.tenant_id,
    )
    return claims


def get_auth_service(
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> AuthService:
    return AuthService(UserRepository(session), settings.default_user_role)


async def get_current_user(
    claims: TokenClaims = Depends(get_current_claims),
    service: AuthService = Depends(get_auth_service),
) -> AppUser:
    user = await service.resolve_user(claims)
    structlog.contextvars.bind_contextvars(user_id=str(user.id))
    return user
