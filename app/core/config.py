from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"

    database_url: str
    database_pool_size: int = 10
    database_max_overflow: int = 5

    credentials_encryption_key: str


@lru_cache
def get_settings() -> Settings:
    return Settings()
