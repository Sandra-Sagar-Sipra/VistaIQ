import structlog

from app.auth.jwt import TokenClaims
from app.core.exceptions import AuthenticationError
from app.models.user import AppUser
from app.repositories.postgres.user_repository import UserRepository

logger = structlog.get_logger(__name__)


class AuthService:
    """Turns verified token claims into a local user row (WBS task 3.2)."""

    def __init__(self, repository: UserRepository, default_role: str | None) -> None:
        self._repository = repository
        self._default_role = default_role

    async def resolve_user(self, claims: TokenClaims) -> AppUser:
        email = claims.email
        if not email:
            # Every downstream screen identifies a user by address, and there
            # is no sensible placeholder. Failing here with a clear message
            # beats storing an empty string and confusing someone later.
            logger.warning("auth_claims_missing_email", object_id=claims.object_id)
            raise AuthenticationError(
                "Sign-in succeeded but the token carried no email address. Add the "
                "'email' optional claim to the app registration's token configuration."
            )

        existing = await self._repository.get_by_entra_object_id(claims.object_id)
        is_first_sign_in = existing is None

        user = await self._repository.provision(
            entra_object_id=claims.object_id,
            entra_tenant_id=claims.tenant_id,
            email=email,
            display_name=claims.display_name,
            default_role=self._default_role,
        )

        # Checked on every request, not only at provisioning, so revoking
        # access takes effect immediately rather than whenever the user's
        # current token happens to expire.
        if not user.is_active:
            logger.warning(
                "auth_rejected_inactive_user",
                user_id=str(user.id),
                object_id=claims.object_id,
            )
            raise AuthenticationError("This account has been deactivated.")

        await self._repository.record_login(
            user,
            email=email,
            display_name=claims.display_name,
            entra_tenant_id=claims.tenant_id,
        )

        if is_first_sign_in:
            logger.info(
                "user_provisioned",
                user_id=str(user.id),
                object_id=claims.object_id,
                tenant_id=claims.tenant_id,
                role=user.role,
            )

        return user
