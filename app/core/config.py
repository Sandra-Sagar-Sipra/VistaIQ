from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"

    database_url: str
    database_pool_size: int = 10
    database_max_overflow: int = 5

    credentials_encryption_key: str

    # ------------------------------------------------------------------
    # Microsoft Entra ID
    # ------------------------------------------------------------------
    # No client secret is read here, deliberately. The frontend is a public
    # client using PKCE and this API only *verifies* tokens against
    # Microsoft's public signing keys, so no flow authenticates with a
    # secret. A secret present in .env is ignored via extra="ignore".
    entra_client_id: str = ""
    entra_tenant_id: str = ""

    # Comma-separated. Declared as a plain string rather than list[str]
    # because pydantic-settings would otherwise try to JSON-decode the value
    # and fail on a bare comma-separated list. Read via allowed_tenant_id_set.
    allowed_tenant_ids: str = ""

    # The scope the frontend requests, and which this API requires to be
    # present in a delegated access token.
    entra_api_scope: str = "access_as_user"

    # ------------------------------------------------------------------
    # Local development authentication bypass (WBS task 3.4)
    # ------------------------------------------------------------------
    auth_bypass_enabled: bool = False
    auth_bypass_email: str = "dev@local"
    auth_bypass_display_name: str = "Local Developer"
    # Stable synthetic identifiers, so the bypass user provisions once and is
    # reused rather than creating a new row on every restart.
    auth_bypass_object_id: str = "00000000-0000-0000-0000-0000000000de"
    auth_bypass_tenant_id: str = "00000000-0000-0000-0000-0000000000ad"

    # ------------------------------------------------------------------
    # Role-based access control
    # ------------------------------------------------------------------
    # Release one grants every authenticated user full access (WBS decision
    # 0.10), so enforcement is off by default. The machinery is built and
    # tested; flipping this to true activates it with no code change.
    rbac_enabled: bool = False
    default_user_role: str = "viewer"

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------
    # Empty by default and the middleware is then not installed at all.
    # In development the Vite dev server proxies /api to this process, so the
    # browser sees the API as same-origin and no CORS is involved. This
    # exists for a deployment that serves the frontend from another origin.
    # Comma-separated; read via cors_allowed_origin_list.
    cors_allowed_origins: str = ""

    @property
    def cors_allowed_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() in {"development", "dev", "local"}

    @property
    def allowed_tenant_id_set(self) -> frozenset[str]:
        return frozenset(t.strip() for t in self.allowed_tenant_ids.split(",") if t.strip())

    @property
    def accepted_audiences(self) -> frozenset[str]:
        """Audience values this API accepts.

        Entra issues ``aud`` as the bare client ID when the Application ID
        URI is ``api://<client-id>``, but some registrations produce the full
        URI instead. Accepting both avoids a 401 that hinges on a portal
        detail nobody remembers setting.
        """
        if not self.entra_client_id:
            return frozenset()
        return frozenset({self.entra_client_id, f"api://{self.entra_client_id}"})

    @model_validator(mode="after")
    def _validate_auth_configuration(self) -> "Settings":
        # The bypass turns every request into a fixed test user. Escaping
        # into a deployed environment would remove authentication entirely,
        # so the application refuses to start rather than logging a warning
        # nobody reads.
        if self.auth_bypass_enabled and not self.is_development:
            raise ValueError(
                "AUTH_BYPASS_ENABLED is true but ENVIRONMENT is "
                f"'{self.environment}'. The authentication bypass may only be "
                "used when ENVIRONMENT is development/dev/local. Refusing to start."
            )

        if self.auth_bypass_enabled:
            return self

        missing: list[str] = []
        if not self.entra_client_id:
            missing.append("ENTRA_CLIENT_ID")
        if not self.allowed_tenant_id_set:
            missing.append("ALLOWED_TENANT_IDS")
        if missing:
            raise ValueError(
                f"Missing required authentication settings: {', '.join(missing)}. "
                "Set them in .env, or set AUTH_BYPASS_ENABLED=true for local "
                "development without an Entra tenant."
            )

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
