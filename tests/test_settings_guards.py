"""The start-up guards around authentication configuration.

These matter more than they look. The bypass turns every request into a
fixed test user; if it ever reached a deployed environment the API would be
open to anyone. Refusing to start is the only failure mode that cannot be
ignored -- a warning in a log is not a control.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from tests.conftest import make_settings

BASE = {
    "database_url": "postgresql+asyncpg://u:p@localhost/db",
    "credentials_encryption_key": "k",
}
TENANT = "11111111-1111-1111-1111-111111111111"
CLIENT = "22222222-2222-2222-2222-222222222222"


def test_bypass_allowed_in_development():
    settings = make_settings(**BASE, environment="development", auth_bypass_enabled=True)
    assert settings.auth_bypass_enabled is True


@pytest.mark.parametrize("environment", ["production", "staging", "prod", "uat", "pre-prod"])
def test_bypass_refuses_to_start_outside_development(environment):
    with pytest.raises(ValidationError, match="Refusing to start"):
        make_settings(**BASE, environment=environment, auth_bypass_enabled=True)


def test_entra_settings_required_when_bypass_is_off():
    with pytest.raises(ValidationError, match="ENTRA_CLIENT_ID"):
        make_settings(**BASE, environment="production", auth_bypass_enabled=False)


def test_allowlist_required_when_bypass_is_off():
    """Starting with an empty allowlist would be an open door, not a default."""
    with pytest.raises(ValidationError, match="ALLOWED_TENANT_IDS"):
        make_settings(
            **BASE,
            environment="production",
            auth_bypass_enabled=False,
            entra_client_id=CLIENT,
            allowed_tenant_ids="",
        )


def test_valid_production_configuration_starts():
    settings = make_settings(
        **BASE,
        environment="production",
        entra_client_id=CLIENT,
        allowed_tenant_ids=TENANT,
    )
    assert settings.allowed_tenant_id_set == {TENANT}


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------


def test_allowlist_parses_comma_separated_values_and_trims_whitespace():
    settings = make_settings(
        **BASE,
        entra_client_id=CLIENT,
        allowed_tenant_ids=f" {TENANT} , 33333333-3333-3333-3333-333333333333 ,",
    )
    assert settings.allowed_tenant_id_set == {
        TENANT,
        "33333333-3333-3333-3333-333333333333",
    }


def test_accepted_audiences_covers_both_forms():
    settings = make_settings(**BASE, entra_client_id=CLIENT, allowed_tenant_ids=TENANT)
    assert settings.accepted_audiences == {CLIENT, f"api://{CLIENT}"}


def test_cors_middleware_is_not_configured_by_default():
    settings = make_settings(**BASE, entra_client_id=CLIENT, allowed_tenant_ids=TENANT)
    assert settings.cors_allowed_origin_list == []


def test_cors_origins_parse_when_provided():
    settings = make_settings(
        **BASE,
        entra_client_id=CLIENT,
        allowed_tenant_ids=TENANT,
        cors_allowed_origins="http://localhost:5173, https://vistaiq.example.com",
    )
    assert settings.cors_allowed_origin_list == [
        "http://localhost:5173",
        "https://vistaiq.example.com",
    ]


@pytest.mark.parametrize("environment", ["development", "dev", "local", "DEVELOPMENT"])
def test_is_development_recognises_expected_values(environment):
    settings = make_settings(**BASE, environment=environment, auth_bypass_enabled=True)
    assert settings.is_development is True
