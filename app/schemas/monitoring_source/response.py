from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, ConfigDict

from app.schemas.monitoring_source.enums import AuthMethod, IngestionMode, SourceType


class MonitoringSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    source_type: SourceType
    vendor: str
    base_url: AnyHttpUrl
    auth_method: AuthMethod
    ingestion_mode: IngestionMode
    poll_interval_seconds: Optional[int]
    connection_status: str
    last_sync_at: Optional[datetime]
    last_sync_error: Optional[str]
    is_enabled: bool
    created_at: datetime
    updated_at: datetime


class MonitoringSourceListResponse(BaseModel):
    items: list[MonitoringSourceResponse]
    total: int


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    latency_ms: int


class SyncTriggerResponse(BaseModel):
    sync_run_id: UUID
    status: Literal["queued"]
