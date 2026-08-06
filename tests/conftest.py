"""Shared fixtures for authentication tests.

Tokens here are signed with a real RSA key generated per test session and
served through a fake JWKS endpoint, so the validator exercises genuine
signature verification rather than a mock that would pass regardless.
"""

from __future__ import annotations

import json
import time
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from app.auth.jwt import JwksCache, TokenValidator
from app.core.config import Settings

TENANT_ID = "11111111-1111-1111-1111-111111111111"
OTHER_TENANT_ID = "99999999-9999-9999-9999-999999999999"
CLIENT_ID = "22222222-2222-2222-2222-222222222222"
OBJECT_ID = "33333333-3333-3333-3333-333333333333"
KID = "test-key-1"
SCOPE = "access_as_user"


def _public_jwk(private_key: rsa.RSAPrivateKey, kid: str) -> dict[str, Any]:
    jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(private_key.public_key()))
    jwk.update({"kid": kid, "use": "sig", "alg": "RS256"})
    return jwk


@pytest.fixture(scope="session")
def private_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(scope="session")
def second_private_key() -> rsa.RSAPrivateKey:
    """A key the validator has never seen, for rotation and forgery tests."""
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


_ENV_VARS_UNDER_TEST = (
    "ENVIRONMENT",
    "ENTRA_CLIENT_ID",
    "ENTRA_TENANT_ID",
    "ALLOWED_TENANT_IDS",
    "ENTRA_API_SCOPE",
    "AUTH_BYPASS_ENABLED",
    "RBAC_ENABLED",
    "DEFAULT_USER_ROLE",
    "CORS_ALLOWED_ORIGINS",
)


@pytest.fixture(autouse=True)
def isolated_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    """Stop the developer's real environment leaking into tests.

    Without this a test asserting "missing ENTRA_CLIENT_ID is refused" passes
    on a clean machine and fails on one where the variable is exported --
    the kind of failure that gets dismissed as flakiness.

    Settings is additionally constructed with ``_env_file=None`` throughout,
    so the repository's own .env is not read either.
    """
    for name in _ENV_VARS_UNDER_TEST:
        monkeypatch.delenv(name, raising=False)


def make_settings(**overrides) -> Settings:
    """Build Settings from explicit values only, ignoring .env."""
    return Settings(_env_file=None, **overrides)


@pytest.fixture
def settings() -> Settings:
    return make_settings(
        environment="development",
        database_url="postgresql+asyncpg://u:p@localhost/db",
        credentials_encryption_key="test-key",
        entra_client_id=CLIENT_ID,
        entra_tenant_id=TENANT_ID,
        allowed_tenant_ids=TENANT_ID,
        entra_api_scope=SCOPE,
        auth_bypass_enabled=False,
    )


class FakeJwksCache(JwksCache):
    """A JWKS cache backed by an in-memory key set.

    Counts fetches so tests can assert that a rejected tenant never causes a
    network call, and that an unknown key ID triggers exactly one refresh.
    """

    def __init__(self, keys: list[dict[str, Any]]) -> None:
        super().__init__()
        self.keys = keys
        self.fetch_count = 0

    async def _fetch(self, tenant_id: str) -> dict[str, Any]:
        self.fetch_count += 1
        return {"keys": list(self.keys)}


@pytest.fixture
def jwks_cache(private_key: rsa.RSAPrivateKey) -> FakeJwksCache:
    return FakeJwksCache([_public_jwk(private_key, KID)])


@pytest.fixture
def validator(settings: Settings, jwks_cache: FakeJwksCache) -> TokenValidator:
    return TokenValidator(settings, jwks_cache)


@pytest.fixture
def make_token(private_key: rsa.RSAPrivateKey):
    """Mint a token that is valid unless a test overrides a claim."""

    def _make(
        *,
        key: rsa.RSAPrivateKey | None = None,
        kid: str = KID,
        algorithm: str = "RS256",
        **overrides: Any,
    ) -> str:
        now = int(time.time())
        claims: dict[str, Any] = {
            "iss": f"https://login.microsoftonline.com/{TENANT_ID}/v2.0",
            "aud": CLIENT_ID,
            "sub": "subject-abc",
            "oid": OBJECT_ID,
            "tid": TENANT_ID,
            "iat": now,
            "nbf": now,
            "exp": now + 3600,
            "scp": SCOPE,
            "name": "Ada Lovelace",
            "preferred_username": "ada@example.com",
        }
        claims.update(overrides)
        # Allow a test to drop a claim entirely by passing None.
        claims = {k: v for k, v in claims.items() if v is not None}
        # kid=None means "omit the header entirely" -- PyJWT refuses to encode
        # a null kid, and a token with no kid at all is the case under test.
        headers = {"kid": kid} if kid is not None else {}
        return jwt.encode(
            claims,
            key or private_key,
            algorithm=algorithm,
            headers=headers,
        )

    return _make


@pytest.fixture
def public_jwk_factory():
    return _public_jwk
