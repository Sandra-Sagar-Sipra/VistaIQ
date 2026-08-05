from typing import Any, Optional

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, model_validator

from app.schemas.monitoring_source.enums import AuthMethod, IngestionMode, SourceType


class MonitoringSourceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    source_type: Optional[SourceType] = None
    vendor: Optional[str] = Field(default=None, min_length=1, max_length=100)
    base_url: Optional[AnyHttpUrl] = None
    auth_method: Optional[AuthMethod] = None
    credentials: Optional[dict[str, Any]] = None
    ingestion_mode: Optional[IngestionMode] = None
    poll_interval_seconds: Optional[int] = Field(default=None, gt=0)
    webhook_secret: Optional[str] = Field(default=None, min_length=1)
    is_enabled: Optional[bool] = None

    @model_validator(mode="after")
    def validate_ingestion_requirements(self) -> "MonitoringSourceUpdate":
        # Only validated when both the mode and its dependent field are present
        # in this patch payload. Cross-checking a mode change against a
        # dependent field already stored on the row is enforced by the
        # service layer, which has visibility into the persisted record.
        fields_set = self.model_fields_set
        if (
            self.ingestion_mode == IngestionMode.POLL
            and "poll_interval_seconds" in fields_set
            and self.poll_interval_seconds is None
        ):
            raise ValueError("poll_interval_seconds cannot be null when ingestion_mode is 'poll'")
        if (
            self.ingestion_mode == IngestionMode.WEBHOOK
            and "webhook_secret" in fields_set
            and not self.webhook_secret
        ):
            raise ValueError("webhook_secret cannot be empty when ingestion_mode is 'webhook'")
        return self
