from fastapi import FastAPI

from app.api.v1.api_router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging

settings = get_settings()
configure_logging(settings.log_level)

app = FastAPI(
    title="VistaIQ",
    version="0.1.0",
    description="VistaIQ monitoring, security, and DevOps observability platform.",
)

app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}
