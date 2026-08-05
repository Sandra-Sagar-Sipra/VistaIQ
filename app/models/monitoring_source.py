import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, LargeBinary, String, Text, func
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base

# Enum types are created by the monitoring_source SQL migration;
# create_type=False stops SQLAlchemy from re-issuing CREATE TYPE.
auth_method_enum = PgEnum(
    "api_key", "oauth2", "basic", "bearer_token",
    name="auth_method",
    create_type=False,
)

ingestion_mode_enum = PgEnum(
    "poll", "webhook",
    name="ingestion_mode",
    create_type=False,
)


class MonitoringSource(Base):
    __tablename__ = "monitoring_source"

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    source_type: Mapped[str] = mapped_column(String(255), nullable=False)
    vendor: Mapped[str] = mapped_column(String(255), nullable=False)
    base_url: Mapped[str] = mapped_column(Text, nullable=False)
    auth_method: Mapped[str] = mapped_column(auth_method_enum, nullable=False)
    credentials: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    ingestion_mode: Mapped[str] = mapped_column(ingestion_mode_enum, nullable=False)
    poll_interval_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    webhook_secret: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    connection_status: Mapped[str] = mapped_column(Text, nullable=False, server_default="unknown")
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_sync_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
