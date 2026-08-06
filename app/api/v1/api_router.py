from fastapi import APIRouter

from app.api.v1.monitoring_source.router import router as monitoring_source_router
from app.api.v1.applications.router import router as applications_router

api_router = APIRouter()
api_router.include_router(monitoring_source_router)
api_router.include_router(applications_router)
