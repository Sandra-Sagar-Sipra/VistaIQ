"""Validation of Microsoft Entra ID access tokens.

This module is the security boundary of the API. Everything downstream
trusts the claims it returns, so the order of checks matters:

1. Reject any token whose ``tid`` is not in the allowlist, *before* making
   any network call. The app registration is multi-tenant, so Microsoft will
   happily issue tokens to users from any organisation in the world; this
   allowlist is the only thing standing between them and VistaIQ's data.
   Checking first also means an unknown party cannot make this server issue
   outbound requests on their behalf.
2. Only then fetch that tenant's public signing keys and verify the token
   cryptographically.

Nothing here uses a client secret. Verification uses Microsoft's public
keys, which is why the frontend can be a public client using PKCE.
"""

from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass
from typing import Any

import httpx
import jwt
import structlog
from jwt.algorithms import RSAAlgorithm

from app.core.config import Settings
from app.core.exceptions import AuthenticationError, IdentityProviderError

logger = structlog.get_logger(__name__)

# Entra signs with RS256. Pinning the accepted algorithms is not optional:
# passing the token's own "alg" header to the decoder is the classic
# algorithm-confusion vulnerability, where an attacker submits an unsigned
# ("none") or HMAC-signed token and the verifier obligingly accepts it.
_ALLOWED_ALGORITHMS = ("RS256",)

# Signing keys rotate on the order of weeks. An hour of caching removes a
# round trip from every request without meaningfully delaying rotation --
# and an unrecognised key ID forces an immediate refresh anyway.
_JWKS_TTL_SECONDS = 3600
_JWKS_HTTP_TIMEOUT_SECONDS = 5.0

# Tolerance for clock skew between this server and Microsoft.
_LEEWAY_SECONDS = 60


@dataclass(frozen=True)
class TokenClaims:
    """The verified contents of an access token."""

    subject: str
    object_id: str
    tenant_id: str
    email: str | None
    display_name: str | None
    scopes: frozenset[str]
    roles: frozenset[str]
    raw: dict[str, Any]

    @property
    def is_bypass(self) -> bool:
        return self.raw.get("_vistaiq_bypass") is True


class JwksCache:
    """Per-tenant cache of Microsoft's public signing keys.

    A lock per tenant stops a cache miss under load from triggering a
    stampede of identical requests to Microsoft, which would be both slow
    and liable to rate limiting.
    """

    def __init__(self, ttl_seconds: int = _JWKS_TTL_SECONDS) -> None:
        self._ttl = ttl_seconds
        self._entries: dict[str, tuple[float, dict[str, Any]]] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._locks_guard = asyncio.Lock()

    @staticmethod
    def jwks_uri(tenant_id: str) -> str:
        return f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"

    async def _lock_for(self, tenant_id: str) -> asyncio.Lock:
        async with self._locks_guard:
            return self._locks.setdefault(tenant_id, asyncio.Lock())

    async def get(self, tenant_id: str, *, force_refresh: bool = False) -> dict[str, Any]:
        if not force_refresh:
            cached = self._entries.get(tenant_id)
            if cached is not None and cached[0] > time.monotonic():
                return cached[1]

        lock = await self._lock_for(tenant_id)
        async with lock:
            # Re-check inside the lock: another coroutine may have populated
            # the cache while this one waited for it.
            if not force_refresh:
                cached = self._entries.get(tenant_id)
                if cached is not None and cached[0] > time.monotonic():
                    return cached[1]

            document = await self._fetch(tenant_id)
            self._entries[tenant_id] = (time.monotonic() + self._ttl, document)
            return document

    async def _fetch(self, tenant_id: str) -> dict[str, Any]:
        url = self.jwks_uri(tenant_id)
        try:
            async with httpx.AsyncClient(timeout=_JWKS_HTTP_TIMEOUT_SECONDS) as client:
                response = await client.get(url)
                response.raise_for_status()
                document = response.json()
        except httpx.HTTPError as exc:
            logger.error("jwks_fetch_failed", tenant_id=tenant_id, url=url, error=str(exc))
            raise IdentityProviderError(
                "Could not reach Microsoft to verify the token. Try again shortly."
            ) from exc
        except ValueError as exc:  # malformed JSON
            logger.error("jwks_malformed", tenant_id=tenant_id, url=url)
            raise IdentityProviderError("Identity provider returned an unreadable key set.") from exc

        if not isinstance(document, dict) or not document.get("keys"):
            logger.error("jwks_empty", tenant_id=tenant_id, url=url)
            raise IdentityProviderError("Identity provider returned no signing keys.")

        logger.info("jwks_refreshed", tenant_id=tenant_id, key_count=len(document["keys"]))
        return document

    def clear(self) -> None:
        self._entries.clear()


class TokenValidator:
    def __init__(self, settings: Settings, cache: JwksCache) -> None:
        self._settings = settings
        self._cache = cache

    @staticmethod
    def expected_issuer(tenant_id: str) -> str:
        # Requires the app registration manifest to set
        # requestedAccessTokenVersion = 2. Left at the v1 default, Entra
        # issues "https://sts.windows.net/{tid}/" instead and every token
        # fails this check.
        return f"https://login.microsoftonline.com/{tenant_id}/v2.0"

    async def validate(self, token: str) -> TokenClaims:
        header = self._read_header(token)
        unverified = self._read_unverified_claims(token)

        tenant_id = unverified.get("tid")
        if not isinstance(tenant_id, str) or not tenant_id:
            raise AuthenticationError("Token is missing a tenant identifier.")

        # ---- The access boundary. Before any network call. ----
        if tenant_id not in self._settings.allowed_tenant_id_set:
            logger.warning(
                "auth_rejected_tenant_not_allowed",
                tenant_id=tenant_id,
                subject=unverified.get("sub"),
            )
            raise AuthenticationError("This organisation is not permitted to access VistaIQ.")

        key = await self._signing_key(tenant_id, header.get("kid"))

        try:
            claims = jwt.decode(
                token,
                key=key,
                algorithms=list(_ALLOWED_ALGORITHMS),
                audience=list(self._settings.accepted_audiences),
                issuer=self.expected_issuer(tenant_id),
                leeway=_LEEWAY_SECONDS,
                options={
                    "require": ["exp", "iat", "iss", "aud", "sub"],
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_aud": True,
                    "verify_iss": True,
                },
            )
        except jwt.ExpiredSignatureError as exc:
            raise AuthenticationError("Token has expired.") from exc
        except jwt.InvalidAudienceError as exc:
            # Overwhelmingly the most common real-world failure: the SPA
            # requested a Microsoft Graph scope instead of this API's custom
            # scope, so the token is addressed elsewhere and rejecting it is
            # correct. Logged loudly because it presents as broken code.
            logger.warning(
                "auth_rejected_audience",
                expected=sorted(self._settings.accepted_audiences),
                received=unverified.get("aud"),
            )
            raise AuthenticationError(
                "Token was issued for a different application. The client must request "
                f"the scope api://{self._settings.entra_client_id}/{self._settings.entra_api_scope}."
            ) from exc
        except jwt.InvalidIssuerError as exc:
            logger.warning(
                "auth_rejected_issuer",
                expected=self.expected_issuer(tenant_id),
                received=unverified.get("iss"),
            )
            raise AuthenticationError(
                "Token issuer is not recognised. If this is unexpected, check that the "
                "app registration manifest sets requestedAccessTokenVersion to 2."
            ) from exc
        except jwt.InvalidTokenError as exc:
            logger.warning("auth_rejected_invalid_token", error=str(exc))
            raise AuthenticationError("Token is invalid.") from exc

        self._verify_scope(claims)
        return self._to_claims(claims)

    # ------------------------------------------------------------------
    # internals
    # ------------------------------------------------------------------

    @staticmethod
    def _read_header(token: str) -> dict[str, Any]:
        try:
            header = jwt.get_unverified_header(token)
        except jwt.InvalidTokenError as exc:
            raise AuthenticationError("Token is malformed.") from exc

        algorithm = header.get("alg")
        if algorithm not in _ALLOWED_ALGORITHMS:
            # Refusing here, rather than handing the header's algorithm to
            # the decoder, is what prevents algorithm-confusion attacks.
            logger.warning("auth_rejected_algorithm", algorithm=algorithm)
            raise AuthenticationError("Token uses an unsupported signing algorithm.")

        return header

    @staticmethod
    def _read_unverified_claims(token: str) -> dict[str, Any]:
        """Read claims without verifying, purely to learn the tenant.

        Nothing read here is trusted. It only selects which public key to
        verify against; every value is re-read from the verified payload.
        """
        try:
            return jwt.decode(token, options={"verify_signature": False})
        except jwt.InvalidTokenError as exc:
            raise AuthenticationError("Token is malformed.") from exc

    async def _signing_key(self, tenant_id: str, kid: str | None) -> Any:
        if not kid:
            raise AuthenticationError("Token does not identify a signing key.")

        document = await self._cache.get(tenant_id)
        key = self._find_key(document, kid)
        if key is not None:
            return key

        # A key ID we have not seen usually means Microsoft rotated keys
        # since this cache entry was written. Refresh once before giving up,
        # otherwise every request would fail until the TTL expired.
        logger.info("jwks_kid_miss_refreshing", tenant_id=tenant_id, kid=kid)
        document = await self._cache.get(tenant_id, force_refresh=True)
        key = self._find_key(document, kid)
        if key is None:
            logger.warning("auth_rejected_unknown_kid", tenant_id=tenant_id, kid=kid)
            raise AuthenticationError("Token was signed with an unrecognised key.")
        return key

    @staticmethod
    def _find_key(document: dict[str, Any], kid: str) -> Any | None:
        for entry in document.get("keys", []):
            if entry.get("kid") != kid or entry.get("kty") != "RSA":
                continue
            try:
                return RSAAlgorithm.from_jwk(json.dumps(entry))
            except (ValueError, TypeError, jwt.exceptions.PyJWKError):
                logger.warning("jwks_key_unusable", kid=kid)
                return None
        return None

    def _verify_scope(self, claims: dict[str, Any]) -> None:
        """Require the delegated scope this API exposes.

        Without this, any token addressed to this application would be
        accepted, including one minted for a different scope of the same
        registration.
        """
        required = self._settings.entra_api_scope
        if not required:
            return

        raw_scope = claims.get("scp") or claims.get("scope")
        if raw_scope:
            granted = {s for s in str(raw_scope).split() if s}
            if required in granted:
                return
            logger.warning("auth_rejected_scope", required=required, granted=sorted(granted))
            raise AuthenticationError(f"Token does not grant the required scope '{required}'.")

        if claims.get("roles"):
            # An application-only token (client credentials). No daemon flow
            # is defined for VistaIQ yet, so accepting one would grant access
            # under rules nobody has specified.
            logger.warning("auth_rejected_app_only_token", subject=claims.get("sub"))
            raise AuthenticationError("Application-only tokens are not accepted. Sign in as a user.")

        raise AuthenticationError(f"Token does not grant the required scope '{required}'.")

    @staticmethod
    def _to_claims(claims: dict[str, Any]) -> TokenClaims:
        # "oid" is the stable per-user identifier. "sub" is stable only
        # within a single application, so it is kept for logging but never
        # used as the local identity key.
        object_id = claims.get("oid")
        if not isinstance(object_id, str) or not object_id:
            raise AuthenticationError("Token is missing the user object identifier.")

        # Entra populates the address differently depending on account type
        # and which optional claims are configured, so fall back in order of
        # reliability rather than assuming one is present.
        email = (
            claims.get("email")
            or claims.get("preferred_username")
            or claims.get("upn")
            or claims.get("unique_name")
        )

        raw_scope = claims.get("scp") or claims.get("scope") or ""
        roles = claims.get("roles") or []

        return TokenClaims(
            subject=str(claims.get("sub", "")),
            object_id=object_id,
            tenant_id=str(claims.get("tid", "")),
            email=str(email) if email else None,
            display_name=claims.get("name"),
            scopes=frozenset(s for s in str(raw_scope).split() if s),
            roles=frozenset(str(r) for r in roles),
            raw=claims,
        )


def bypass_claims(settings: Settings) -> TokenClaims:
    """Synthetic claims for the local development bypass (WBS task 3.4).

    Reachable only when AUTH_BYPASS_ENABLED is true, which Settings refuses
    to allow outside a development environment.
    """
    return TokenClaims(
        subject=settings.auth_bypass_object_id,
        object_id=settings.auth_bypass_object_id,
        tenant_id=settings.auth_bypass_tenant_id,
        email=settings.auth_bypass_email,
        display_name=settings.auth_bypass_display_name,
        scopes=frozenset({settings.entra_api_scope}),
        roles=frozenset(),
        raw={"_vistaiq_bypass": True},
    )
