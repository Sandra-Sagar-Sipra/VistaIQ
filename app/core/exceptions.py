class DomainError(Exception):
    """Base class for domain-level errors raised by the service layer."""


class NotFoundError(DomainError):
    def __init__(self, resource: str, identifier: object) -> None:
        self.resource = resource
        self.identifier = identifier
        super().__init__(f"{resource} '{identifier}' was not found")


class ConflictError(DomainError):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class InvalidStateError(DomainError):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class AuthenticationError(DomainError):
    """The caller could not be identified. Maps to HTTP 401.

    The message is returned to the client, so it must describe the class of
    failure without narrating which check failed in a way that helps an
    attacker probe the validator.
    """

    def __init__(self, message: str = "Not authenticated") -> None:
        super().__init__(message)


class AuthorizationError(DomainError):
    """The caller is known but not permitted. Maps to HTTP 403."""

    def __init__(self, message: str = "Insufficient permissions") -> None:
        super().__init__(message)


class IdentityProviderError(DomainError):
    """Entra could not be reached or answered unusably. Maps to HTTP 503.

    Distinct from AuthenticationError on purpose: a token that cannot be
    checked because Microsoft is unreachable is not the same as a token that
    was checked and found invalid, and returning 401 for it would send users
    into a pointless re-login loop during an outage.
    """

    def __init__(self, message: str = "Identity provider unavailable") -> None:
        super().__init__(message)
