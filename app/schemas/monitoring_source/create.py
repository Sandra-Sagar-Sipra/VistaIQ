from typing import Any, Optional

from pydantic import AnyHttpUrl, BaseModel, Field, model_validator

from app.schemas.monitoring_source.enums import AuthMethod, IngestionMode, SourceType


class MonitoringSourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    source_type: SourceType
    vendor: str = Field(..., min_length=1, max_length=100, examples=["veracode", "github", "dynatrace"])
    base_url: AnyHttpUrl
    auth_method: AuthMethod
    credentials: dict[str, Any] = Field(
        ...,
        description=(
            "Raw credential payload for the vendor integration. Encrypted at "
            "rest by the repository via pgp_sym_encrypt before persistence."
        ),
    )
    ingestion_mode: IngestionMode
    poll_interval_seconds: Optional[int] = Field(default=None, gt=0)
    webhook_secret: Optional[str] = Field(default=None, min_length=1)
    is_enabled: bool = True

    @model_validator(mode="after")
    def validate_ingestion_requirements(self) -> "MonitoringSourceCreate":
        if self.ingestion_mode == IngestionMode.POLL and self.poll_interval_seconds is None:
            raise ValueError("poll_interval_seconds is required when ingestion_mode is 'poll'")
        if self.ingestion_mode == IngestionMode.WEBHOOK and not self.webhook_secret:
            raise ValueError("webhook_secret is required when ingestion_mode is 'webhook'")
        return self
