from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from app.schemas.monitoring_source import AuthMethod


@dataclass(frozen=True)
class VendorConnectionResult:
    success: bool
    message: str
    latency_ms: int


class VendorAdapter(ABC):
    """
    Contract each vendor integration (veracode, github, dynatrace, datadog,
    cloudwatch, newrelic, ...) implements to support connectivity checks and,
    eventually, event collection during ingestion.
    """

    @abstractmethod
    async def test_connection(
        self,
        *,
        base_url: str,
        auth_method: AuthMethod,
        credentials: dict[str, Any],
    ) -> VendorConnectionResult:
        ...
