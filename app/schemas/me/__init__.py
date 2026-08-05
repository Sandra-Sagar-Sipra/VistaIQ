import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MeResponse(BaseModel):
    """The signed-in user (WBS task 3.3).

    Deliberately narrow. The Entra object and tenant identifiers are
    included because the frontend and support staff need them to correlate a
    VistaIQ user with a directory entry, but no raw token claims are echoed
    back -- a response body is not the place to re-serve something the
    client already holds.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    display_name: str | None = None
    entra_object_id: str
    entra_tenant_id: str
    role: str | None = Field(
        default=None,
        description="Reserved. Not enforced unless RBAC_ENABLED is set (WBS decision 0.10).",
    )
    is_active: bool
    last_login_at: datetime | None = None
    created_at: datetime
