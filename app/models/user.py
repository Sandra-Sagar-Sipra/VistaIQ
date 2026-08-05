import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class AppUser(Base):
    """A user provisioned from an Entra sign-in.

    VistaIQ never stores a password. Identity is owned by Entra; this table
    exists so alerts, incidents and saved views can reference a local row,
    and so sign-ins can be audited.
    """

    __tablename__ = "app_user"

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )

    # The Entra object ID ("oid" claim). This is the stable identifier for a
    # user: unlike email or UPN it does not change when someone is renamed.
    # The unique constraint is what makes concurrent first sign-ins safe --
    # the database rejects the loser of the race, rather than the
    # application trying to check-then-insert.
    entra_object_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)

    # The tenant the user signed in from ("tid" claim). Recorded because the
    # app registration is multi-tenant, so this is not always the home
    # tenant, and the origin matters for any later audit.
    entra_tenant_id: Mapped[str] = mapped_column(String(64), nullable=False)

    email: Mapped[str] = mapped_column(String(320), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Reserved for RBAC. Release one grants every authenticated user full
    # access (WBS decision 0.10), so this is populated but not enforced
    # unless RBAC_ENABLED is set.
    role: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Lets an account be disabled locally without touching the directory.
    # Checked on every request, so a disabled user is refused even while
    # holding an otherwise valid, unexpired Entra token.
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<AppUser {self.email} ({self.entra_object_id})>"
