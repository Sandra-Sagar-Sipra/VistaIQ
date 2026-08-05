"""fix component environment_id fk ondelete restrict

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-05

Changes
-------
1. Drops the existing ``fk_component_environment_id`` foreign key (which was
   created without an ON DELETE clause, meaning PostgreSQL silently defaulted
   to NO ACTION / NO ACTION).
2. Recreates it with ``ON DELETE RESTRICT`` so the database prevents deletion
   of an environment row that is still referenced by a component row.

Why a new migration instead of editing the previous one
--------------------------------------------------------
The previous migration (a1b2c3d4e5f6) may already have been applied to the
database. Editing an applied migration is unsafe. This migration is fully
reversible (downgrade restores the original NO ACTION behaviour).

Tables that reference component(id)
------------------------------------
All model files that would eventually reference component(id) (mapping, alert,
incident, dashboard, correlation_group, deduplication_policy) are currently
empty stubs -- no migrations exist for them yet. There are therefore no
cross-table ON DELETE conventions to verify at this time.

set_updated_at trigger
----------------------
No set_updated_at() trigger function exists anywhere in the project. The
project convention (established in monitoring_source) is to set updated_at via
server_default=now() and onupdate=func.now() in ORM layer. No DB trigger is
needed or added.
"""
from typing import Sequence, Union

from alembic import op

# ---------------------------------------------------------------------------
# Revision identifiers
# ---------------------------------------------------------------------------
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Constraint name — must match exactly what was created in a1b2c3d4e5f6
_FK_NAME = "fk_component_environment_id"
_TABLE = "component"


# ---------------------------------------------------------------------------
# Upgrade
# ---------------------------------------------------------------------------
def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Drop the FK if it exists (idempotent — safe whether or not the
    #    constraint was successfully created by the previous migration).
    #
    #    Background: migration a1b2c3d4e5f6 used use_alter=True which emits
    #    ALTER TABLE component ADD CONSTRAINT ... REFERENCES environment(id).
    #    If the environment table did not exist at that point, PostgreSQL
    #    rejected that statement and the FK was never created.
    #    Using IF EXISTS here makes this step safe in both cases.
    # ------------------------------------------------------------------
    op.execute(
        "ALTER TABLE component DROP CONSTRAINT IF EXISTS fk_component_environment_id"
    )

    # ------------------------------------------------------------------
    # 2. Add the FK with ON DELETE RESTRICT — but only when the environment
    #    table actually exists.  If it does not exist yet, a later migration
    #    that creates environment should add this FK at that point.
    # ------------------------------------------------------------------
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public'
                   AND table_name   = 'environment'
            ) THEN
                ALTER TABLE component
                    ADD CONSTRAINT fk_component_environment_id
                    FOREIGN KEY (environment_id)
                    REFERENCES environment(id)
                    ON DELETE RESTRICT;
            END IF;
        END;
        $$;
        """
    )


# ---------------------------------------------------------------------------
# Downgrade
# ---------------------------------------------------------------------------
def downgrade() -> None:
    # Drop the RESTRICT FK if it exists
    op.execute(
        "ALTER TABLE component DROP CONSTRAINT IF EXISTS fk_component_environment_id"
    )

    # Restore the original NO ACTION FK — again only if environment exists
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public'
                   AND table_name   = 'environment'
            ) THEN
                ALTER TABLE component
                    ADD CONSTRAINT fk_component_environment_id
                    FOREIGN KEY (environment_id)
                    REFERENCES environment(id);
                    -- No ON DELETE clause → PostgreSQL default: NO ACTION
            END IF;
        END;
        $$;
        """
    )
