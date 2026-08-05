"""Role-based access control.

WBS decision 0.10 records that release one authenticates but does not
authorise: every signed-in user may see everything. So this machinery ships
complete but inert -- ``RBAC_ENABLED`` is false by default and every check
passes through.

It exists now rather than later because retrofitting authorisation onto
endpoints that were written without it means revisiting every route. With
this in place, switching enforcement on is a configuration change plus
assigning roles, not a refactor.

Authentication is still required regardless of this setting. Turning RBAC
off does not make an endpoint public; it only stops the role from being
consulted.
"""

from __future__ import annotations

from enum import Enum

import structlog
from fastapi import Depends

from app.auth.dependencies import get_current_user
from app.core.config import Settings, get_settings
from app.core.exceptions import AuthorizationError
from app.models.user import AppUser

logger = structlog.get_logger(__name__)


class Role(str, Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


# Roles are ranked, not merely distinct: an administrator can do anything an
# operator can. Requiring VIEWER therefore admits all three, which avoids
# every call site having to spell out the full list.
_RANK: dict[Role, int] = {
    Role.VIEWER: 0,
    Role.OPERATOR: 1,
    Role.ADMIN: 2,
}


def role_satisfies(actual: Role, minimum: Role) -> bool:
    return _RANK[actual] >= _RANK[minimum]


def parse_role(value: str | None) -> Role | None:
    if not value:
        return None
    try:
        return Role(value)
    except ValueError:
        # A role string the database allowed but this code does not know.
        # Treated as no role rather than as permission.
        logger.warning("unknown_role_value", role=value)
        return None


def require_role(minimum: Role):
    """Dependency factory requiring at least ``minimum``.

        @router.delete("/{id}", dependencies=[Depends(require_role(Role.ADMIN))])

    While RBAC is disabled this authenticates and passes through.
    """

    async def dependency(
        user: AppUser = Depends(get_current_user),
        settings: Settings = Depends(get_settings),
    ) -> AppUser:
        if not settings.rbac_enabled:
            return user

        actual = parse_role(user.role)
        if actual is None:
            logger.warning(
                "authz_rejected_no_role",
                user_id=str(user.id),
                required=minimum.value,
            )
            raise AuthorizationError(
                "This account has no role assigned. Ask an administrator to grant one."
            )

        if not role_satisfies(actual, minimum):
            logger.warning(
                "authz_rejected_insufficient_role",
                user_id=str(user.id),
                actual=actual.value,
                required=minimum.value,
            )
            raise AuthorizationError(
                f"This action requires the '{minimum.value}' role or higher."
            )

        return user

    return dependency


# Convenience aliases for the common cases.
require_admin = require_role(Role.ADMIN)
require_operator = require_role(Role.OPERATOR)
require_viewer = require_role(Role.VIEWER)
