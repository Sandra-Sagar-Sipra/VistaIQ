"""Tests for the API's security boundary.

Every test here asserts a *rejection* except the first. That imbalance is
deliberate: the cost of wrongly accepting a token is unauthorised access to
every alert in the system, while the cost of wrongly rejecting one is a
failed request.
"""

from __future__ import annotations

import time

import jwt
import pytest

from app.auth.jwt import TokenValidator, bypass_claims
from app.core.exceptions import AuthenticationError, IdentityProviderError
from tests.conftest import (
    CLIENT_ID,
    KID,
    OBJECT_ID,
    OTHER_TENANT_ID,
    SCOPE,
    TENANT_ID,
    FakeJwksCache,
    make_settings,
)


async def test_valid_token_is_accepted(validator, make_token):
    claims = await validator.validate(make_token())

    assert claims.object_id == OBJECT_ID
    assert claims.tenant_id == TENANT_ID
    assert claims.email == "ada@example.com"
    assert claims.display_name == "Ada Lovelace"
    assert SCOPE in claims.scopes


async def test_audience_accepted_as_full_uri(validator, make_token):
    """Some registrations issue aud as api://<client-id> rather than the GUID."""
    claims = await validator.validate(make_token(aud=f"api://{CLIENT_ID}"))
    assert claims.object_id == OBJECT_ID


# ---------------------------------------------------------------------------
# The tenant allowlist -- the access boundary for a multi-tenant registration
# ---------------------------------------------------------------------------


async def test_token_from_unlisted_tenant_is_rejected(validator, make_token):
    token = make_token(
        tid=OTHER_TENANT_ID,
        iss=f"https://login.microsoftonline.com/{OTHER_TENANT_ID}/v2.0",
    )
    with pytest.raises(AuthenticationError, match="not permitted"):
        await validator.validate(token)


async def test_unlisted_tenant_never_triggers_a_key_fetch(validator, jwks_cache, make_token):
    """An unknown tenant must not make this server call out on their behalf."""
    token = make_token(
        tid=OTHER_TENANT_ID,
        iss=f"https://login.microsoftonline.com/{OTHER_TENANT_ID}/v2.0",
    )
    with pytest.raises(AuthenticationError):
        await validator.validate(token)

    assert jwks_cache.fetch_count == 0


async def test_missing_tenant_claim_is_rejected(validator, make_token):
    with pytest.raises(AuthenticationError, match="tenant"):
        await validator.validate(make_token(tid=None))


# ---------------------------------------------------------------------------
# Signature and algorithm
# ---------------------------------------------------------------------------


async def test_token_signed_by_unknown_key_is_rejected(validator, make_token, second_private_key):
    """A forged token signed with an attacker's own key must not pass."""
    token = make_token(key=second_private_key)
    with pytest.raises(AuthenticationError):
        await validator.validate(token)


async def test_unsigned_token_is_rejected(validator, make_token):
    """alg=none is the oldest JWT attack and must be refused outright."""
    token = jwt.encode({"tid": TENANT_ID, "oid": OBJECT_ID}, key="", algorithm="none")
    with pytest.raises(AuthenticationError, match="unsupported signing algorithm"):
        await validator.validate(token)


async def test_hmac_signed_token_is_rejected(validator):
    """Algorithm confusion: signing with HMAC using a public value as the key."""
    now = int(time.time())
    token = jwt.encode(
        {
            "iss": f"https://login.microsoftonline.com/{TENANT_ID}/v2.0",
            "aud": CLIENT_ID,
            "sub": "s",
            "oid": OBJECT_ID,
            "tid": TENANT_ID,
            "iat": now,
            "exp": now + 3600,
            "scp": SCOPE,
        },
        key="not-a-real-secret",
        algorithm="HS256",
        headers={"kid": KID},
    )
    with pytest.raises(AuthenticationError, match="unsupported signing algorithm"):
        await validator.validate(token)


async def test_malformed_token_is_rejected(validator):
    with pytest.raises(AuthenticationError, match="malformed"):
        await validator.validate("this-is-not-a-jwt")


async def test_token_without_kid_is_rejected(validator, make_token):
    with pytest.raises(AuthenticationError, match="signing key"):
        await validator.validate(make_token(kid=None))


# ---------------------------------------------------------------------------
# Standard claim checks
# ---------------------------------------------------------------------------


async def test_expired_token_is_rejected(validator, make_token):
    now = int(time.time())
    with pytest.raises(AuthenticationError, match="expired"):
        await validator.validate(make_token(exp=now - 3600, iat=now - 7200))


async def test_wrong_audience_is_rejected(validator, make_token):
    """The Graph-scope mistake: a token addressed to another application."""
    with pytest.raises(AuthenticationError, match="different application"):
        await validator.validate(make_token(aud="00000003-0000-0000-c000-000000000000"))


async def test_v1_issuer_is_rejected(validator, make_token):
    """Manifest left at requestedAccessTokenVersion 1 produces this issuer."""
    with pytest.raises(AuthenticationError, match="issuer"):
        await validator.validate(make_token(iss=f"https://sts.windows.net/{TENANT_ID}/"))


async def test_missing_object_id_is_rejected(validator, make_token):
    with pytest.raises(AuthenticationError, match="object identifier"):
        await validator.validate(make_token(oid=None))


# ---------------------------------------------------------------------------
# Scope
# ---------------------------------------------------------------------------


async def test_token_without_required_scope_is_rejected(validator, make_token):
    with pytest.raises(AuthenticationError, match="required scope"):
        await validator.validate(make_token(scp="User.Read"))


async def test_application_only_token_is_rejected(validator, make_token):
    """Client-credentials tokens carry roles and no scp. No daemon flow exists."""
    with pytest.raises(AuthenticationError, match="Application-only"):
        await validator.validate(make_token(scp=None, roles=["Alerts.Read"]))


async def test_scope_matched_among_several(validator, make_token):
    claims = await validator.validate(make_token(scp=f"openid profile {SCOPE}"))
    assert SCOPE in claims.scopes


# ---------------------------------------------------------------------------
# Key rotation
# ---------------------------------------------------------------------------


async def test_unknown_kid_triggers_exactly_one_refresh(validator, jwks_cache, make_token):
    with pytest.raises(AuthenticationError, match="unrecognised key"):
        await validator.validate(make_token(kid="rotated-away"))

    # One priming fetch plus one forced refresh. More would mean a retry loop
    # against Microsoft on every bad token.
    assert jwks_cache.fetch_count == 2


async def test_rotated_key_is_picked_up_after_refresh(
    settings, private_key, second_private_key, public_jwk_factory, make_token
):
    """A key published after the cache was primed must be found on refresh."""
    cache = FakeJwksCache([public_jwk_factory(private_key, KID)])
    validator = TokenValidator(settings, cache)

    await validator.validate(make_token())  # primes the cache
    assert cache.fetch_count == 1

    # Microsoft rotates: a new key appears, signed tokens now use it.
    cache.keys.append(public_jwk_factory(second_private_key, "new-kid"))
    claims = await validator.validate(make_token(key=second_private_key, kid="new-kid"))

    assert claims.object_id == OBJECT_ID
    assert cache.fetch_count == 2


# ---------------------------------------------------------------------------
# Identity provider outage
# ---------------------------------------------------------------------------


async def test_unreachable_provider_raises_provider_error_not_auth_error(
    settings, make_token
):
    """A Microsoft outage must not present as 'your token is bad'."""

    class BrokenCache(FakeJwksCache):
        async def _fetch(self, tenant_id: str):
            raise IdentityProviderError("Could not reach Microsoft.")

    validator = TokenValidator(settings, BrokenCache([]))

    with pytest.raises(IdentityProviderError):
        await validator.validate(make_token())


# ---------------------------------------------------------------------------
# Email fallbacks
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "claim_name",
    ["email", "preferred_username", "upn", "unique_name"],
)
async def test_email_resolved_from_any_supported_claim(validator, make_token, claim_name):
    overrides = {
        "email": None,
        "preferred_username": None,
        "upn": None,
        "unique_name": None,
        claim_name: "person@example.com",
    }
    claims = await validator.validate(make_token(**overrides))
    assert claims.email == "person@example.com"


async def test_missing_email_claims_yield_none(validator, make_token):
    claims = await validator.validate(
        make_token(email=None, preferred_username=None, upn=None, unique_name=None)
    )
    assert claims.email is None


# ---------------------------------------------------------------------------
# Development bypass
# ---------------------------------------------------------------------------


def test_bypass_claims_are_marked_as_bypass():
    settings = make_settings(
        environment="development",
        database_url="postgresql+asyncpg://u:p@localhost/db",
        credentials_encryption_key="k",
        auth_bypass_enabled=True,
    )
    claims = bypass_claims(settings)

    assert claims.is_bypass is True
    assert claims.email == settings.auth_bypass_email
    assert settings.entra_api_scope in claims.scopes


async def test_real_token_claims_are_not_marked_as_bypass(validator, make_token):
    # Guards against a bug where is_bypass defaulted true and every request
    # silently became the local developer.
    claims = await validator.validate(make_token())
    assert claims.is_bypass is False
