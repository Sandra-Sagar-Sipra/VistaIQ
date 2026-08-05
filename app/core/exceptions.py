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
