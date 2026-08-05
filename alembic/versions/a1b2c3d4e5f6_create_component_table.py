"""create component table

Revision ID: a1b2c3d4e5f6
Revises: 913776c25d57
Create Date: 2026-08-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.types import UserDefinedType
from sqlalchemy.dialects import postgresql


# ---------------------------------------------------------------------------
# Custom ltree type
#
# SQLAlchemy has no built-in ltree type. This minimal UserDefinedType tells
# SQLAlchemy to emit the column DDL as "ltree" so PostgreSQL receives the
# correct native type -- which gist_ltree_ops and the trigger require.
# ---------------------------------------------------------------------------
class Ltree(UserDefinedType):
    """Minimal SQLAlchemy wrapper for the PostgreSQL ltree extension type."""

    cache_ok = True

    def get_col_spec(self, **kw: object) -> str:  # type: ignore[override]
        return "ltree"

# ---------------------------------------------------------------------------
# Revision identifiers
# ---------------------------------------------------------------------------
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "913776c25d57"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# ---------------------------------------------------------------------------
# Enum objects
#
# create_type=False  ->  SQLAlchemy will NOT issue CREATE TYPE automatically.
# We call .create(bind, checkfirst=True) explicitly so the enum is created
# only when it is missing -- making the upgrade idempotent.
#
# On downgrade we intentionally do NOT drop these enums because:
#   - They may have been created by another migration or by the application.
#   - The task explicitly forbids dropping component_type or priority enums.
# ---------------------------------------------------------------------------
component_type_enum = postgresql.ENUM(
    "application",
    "service",
    "database",
    "queue",
    "cache",
    "gateway",
    "load_balancer",
    "storage",
    "external",
    name="component_type",
    create_type=False,
)

priority_enum = postgresql.ENUM(
    "critical",
    "high",
    "medium",
    "low",
    name="priority",
    create_type=False,
)

# ---------------------------------------------------------------------------
# Trigger SQL strings
# ---------------------------------------------------------------------------
_CREATE_TRIGGER_FUNCTION = """\
CREATE OR REPLACE FUNCTION component_set_path_depth()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    parent_path  ltree;
    parent_depth INTEGER;
BEGIN
    IF NEW.parent_id IS NULL THEN
        -- Root node: depth = 0, path = sanitised UUID
        NEW.path  := text2ltree(replace(NEW.id::text, '-', '_'));
        NEW.depth := 0;
    ELSE
        -- Child node: inherit parent path and depth
        SELECT path, depth
          INTO parent_path, parent_depth
          FROM component
         WHERE id = NEW.parent_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION
                'component_set_path_depth: parent % does not exist',
                NEW.parent_id;
        END IF;

        NEW.path  := parent_path || text2ltree(replace(NEW.id::text, '-', '_'));
        NEW.depth := parent_depth + 1;
    END IF;

    RETURN NEW;
END;
$$;
"""

_CREATE_TRIGGER = """\
CREATE TRIGGER trg_component_set_path_depth
BEFORE INSERT OR UPDATE ON component
FOR EACH ROW
EXECUTE FUNCTION component_set_path_depth();
"""

_DROP_TRIGGER = "DROP TRIGGER IF EXISTS trg_component_set_path_depth ON component;"
_DROP_TRIGGER_FUNCTION = "DROP FUNCTION IF EXISTS component_set_path_depth();"


# ---------------------------------------------------------------------------
# Upgrade
# ---------------------------------------------------------------------------
def upgrade() -> None:
    bind = op.get_bind()

    # ------------------------------------------------------------------
    # 1. Extensions
    # ------------------------------------------------------------------
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute("CREATE EXTENSION IF NOT EXISTS ltree")

    # ------------------------------------------------------------------
    # 2. Enum types  (checkfirst=True makes this idempotent)
    # ------------------------------------------------------------------
    component_type_enum.create(bind, checkfirst=True)
    priority_enum.create(bind, checkfirst=True)

    # ------------------------------------------------------------------
    # 3. component table
    # ------------------------------------------------------------------
    op.create_table(
        "component",
        # Primary key
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        # Self-referential FK column (parent)
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        # Core fields
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("component_type", component_type_enum, nullable=False),
        # ltree path -- maintained exclusively by the trigger below
        # Must be native ltree type so gist_ltree_ops and trigger work correctly
        sa.Column("path", Ltree(), nullable=False),
        sa.Column("depth", sa.Integer(), nullable=False),
        sa.Column("owner", sa.Text(), nullable=True),
        # Optional FK to environment
        sa.Column("environment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("criticality", priority_enum, nullable=True),
        sa.Column("status", sa.Text(), nullable=False, server_default="active"),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        # Self-referential FK: ON DELETE RESTRICT
        sa.ForeignKeyConstraint(
            ["parent_id"],
            ["component.id"],
            name="fk_component_parent_id",
            ondelete="RESTRICT",
        ),
        # FK to environment (use_alter so it is emitted after table creation)
        sa.ForeignKeyConstraint(
            ["environment_id"],
            ["environment.id"],
            name="fk_component_environment_id",
            use_alter=True,
        ),
        # UNIQUE(parent_id, name)
        sa.UniqueConstraint("parent_id", "name", name="uq_component_parent_id_name"),
    )

    # ------------------------------------------------------------------
    # 4. Indexes
    # ------------------------------------------------------------------
    # GIST index on path
    # gist_ltree_ops is the default operator class for ltree columns;
    # no need to name it explicitly when the column is truly ltree typed.
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_component_path_gist "
        "ON component USING GIST (path)"
    )

    # BTREE index on parent_id
    op.create_index(
        "idx_component_parent_id_btree",
        "component",
        ["parent_id"],
        unique=False,
    )

    # GIN index on tags array
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_component_tags_gin "
        "ON component USING GIN (tags)"
    )

    # ------------------------------------------------------------------
    # 5. Trigger function + trigger
    # ------------------------------------------------------------------
    op.execute(_CREATE_TRIGGER_FUNCTION)
    op.execute(_CREATE_TRIGGER)


# ---------------------------------------------------------------------------
# Downgrade
# ---------------------------------------------------------------------------
def downgrade() -> None:
    # Drop in reverse dependency order

    # 1. Trigger
    op.execute(_DROP_TRIGGER)

    # 2. Trigger function
    op.execute(_DROP_TRIGGER_FUNCTION)

    # 3. Indexes
    op.execute("DROP INDEX IF EXISTS idx_component_path_gist")
    op.drop_index("idx_component_parent_id_btree", table_name="component")
    op.execute("DROP INDEX IF EXISTS idx_component_tags_gin")

    # 4. environment FK (was added via use_alter -- must be dropped separately)
    op.drop_constraint(
        "fk_component_environment_id",
        "component",
        type_="foreignkey",
    )

    # 5. Drop the component table
    #    This also removes: uq_component_parent_id_name, fk_component_parent_id
    op.drop_table("component")

    # NOTE: component_type enum, priority enum, ltree extension, and
    # environment table are intentionally NOT dropped here.
