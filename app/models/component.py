import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import UserDefinedType

from app.database.base import Base

class Ltree(UserDefinedType):
    """Minimal SQLAlchemy wrapper for the PostgreSQL ltree extension type."""
    cache_ok = True
    def get_col_spec(self, **kw: object) -> str:
        return "ltree"

component_type_enum = PgEnum(
    "application", "service", "database", "queue", "cache", "gateway", 
    "load_balancer", "storage", "external",
    name="component_type",
    create_type=False,
)

priority_enum = PgEnum(
    "critical", "high", "medium", "low",
    name="priority",
    create_type=False,
)


class Component(Base):
    __tablename__ = "component"

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("component.id", ondelete="RESTRICT"), nullable=True
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    component_type: Mapped[str] = mapped_column(component_type_enum, nullable=False)
    
    path: Mapped[str] = mapped_column(Ltree, nullable=False) 
    depth: Mapped[int] = mapped_column(Integer, nullable=False)
    owner: Mapped[str | None] = mapped_column(Text, nullable=True)
    environment_id: Mapped[uuid.UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    criticality: Mapped[str | None] = mapped_column(priority_enum, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="active")
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSONB(astext_type=Text()), nullable=False, server_default="{}"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    parent: Mapped["Component | None"] = relationship(
        "Component", remote_side=[id], back_populates="children"
    )
    children: Mapped[list["Component"]] = relationship(
        "Component", back_populates="parent", cascade="all, delete"
    )
