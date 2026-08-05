"""create monitoring_source table

Revision ID: 913776c25d57
Revises:
Create Date: 2026-08-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "913776c25d57"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

auth_method_enum = postgresql.ENUM(
    "api_key", "oauth2", "basic", "bearer_token",
    name="auth_method",
    create_type=False,
)

ingestion_mode_enum = postgresql.ENUM(
    "poll", "webhook",
    name="ingestion_mode",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    bind = op.get_bind()
    auth_method_enum.create(bind, checkfirst=True)
    ingestion_mode_enum.create(bind, checkfirst=True)

    op.create_table(
        "monitoring_source",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("source_type", sa.String(255), nullable=False),
        sa.Column("vendor", sa.String(255), nullable=False),
        sa.Column("base_url", sa.Text(), nullable=False),
        sa.Column("auth_method", auth_method_enum, nullable=False),
        sa.Column("credentials", sa.LargeBinary(), nullable=False),
        sa.Column("ingestion_mode", ingestion_mode_enum, nullable=False),
        sa.Column("poll_interval_seconds", sa.Integer(), nullable=True),
        sa.Column("webhook_secret", sa.LargeBinary(), nullable=True),
        sa.Column("connection_status", sa.Text(), nullable=False, server_default="unknown"),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_sync_error", sa.Text(), nullable=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "source_type IN ('monitoring', 'security', 'devops', 'cloud')",
            name="monitoring_source_source_type_check",
        ),
        sa.CheckConstraint(
            "ingestion_mode <> 'poll' OR poll_interval_seconds IS NOT NULL",
            name="monitoring_source_poll_requires_interval_check",
        ),
        sa.CheckConstraint(
            "ingestion_mode <> 'webhook' OR webhook_secret IS NOT NULL",
            name="monitoring_source_webhook_requires_secret_check",
        ),
    )


def downgrade() -> None:
    op.drop_table("monitoring_source")

    bind = op.get_bind()
    ingestion_mode_enum.drop(bind, checkfirst=True)
    auth_method_enum.drop(bind, checkfirst=True)
