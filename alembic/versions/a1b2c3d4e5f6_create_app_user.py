"""create app_user table

Revision ID: a1b2c3d4e5f6
Revises: 913776c25d57
Create Date: 2026-08-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "913776c25d57"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "app_user",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        # Unique, and therefore the arbiter of concurrent first sign-ins:
        # two simultaneous requests for a new user both attempt an insert,
        # the database rejects one, and the application re-reads the winner.
        sa.Column("entra_object_id", sa.String(64), nullable=False, unique=True),
        sa.Column("entra_tenant_id", sa.String(64), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=True),
        # Nullable and unenforced in release one (WBS decision 0.10).
        sa.Column("role", sa.String(32), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "role IS NULL OR role IN ('admin', 'operator', 'viewer')",
            name="app_user_role_check",
        ),
    )

    # Sign-in looks a user up by tenant + object ID on every single request.
    # The unique index on entra_object_id already serves that lookup; this
    # index supports listing or auditing the users from one tenant.
    op.create_index("ix_app_user_entra_tenant_id", "app_user", ["entra_tenant_id"])

    # Email is not unique: Entra permits the same address across tenants,
    # and the object ID is the real identity. A lookup index only.
    op.create_index("ix_app_user_email", "app_user", ["email"])


def downgrade() -> None:
    op.drop_index("ix_app_user_email", table_name="app_user")
    op.drop_index("ix_app_user_entra_tenant_id", table_name="app_user")
    op.drop_table("app_user")
