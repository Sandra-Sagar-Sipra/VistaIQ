"""Tests for user provisioning and sign-in recording.

The throttling logic is exercised against a fake session that counts
flushes, so these run without a database. Requiring Postgres here would mean
the tests only run on a machine that happens to have it, which is how test
suites quietly stop being run at all.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.models.user import AppUser
from app.repositories.postgres.user_repository import LOGIN_STAMP_INTERVAL, UserRepository


class FakeSession:
    """Records flushes so a test can assert whether a write would occur."""

    def __init__(self) -> None:
        self.flush_count = 0

    async def flush(self) -> None:
        self.flush_count += 1


@pytest.fixture
def session() -> FakeSession:
    return FakeSession()


@pytest.fixture
def repository(session: FakeSession) -> UserRepository:
    return UserRepository(session)  # type: ignore[arg-type]


def make_user(**overrides) -> AppUser:
    defaults = {
        "entra_object_id": "obj-1",
        "entra_tenant_id": "tenant-1",
        "email": "ada@example.com",
        "display_name": "Ada Lovelace",
        "role": "viewer",
        "is_active": True,
        "last_login_at": None,
    }
    defaults.update(overrides)
    return AppUser(**defaults)


# ---------------------------------------------------------------------------
# Throttling -- this runs on every authenticated request
# ---------------------------------------------------------------------------


async def test_first_sign_in_stamps_the_timestamp(repository, session):
    user = make_user(last_login_at=None)

    await repository.record_login(user, email="ada@example.com", display_name="Ada Lovelace")

    assert user.last_login_at is not None
    assert session.flush_count == 1


async def test_recent_sign_in_does_not_write(repository, session):
    """The common case: an authenticated request must not cost a write."""
    recent = datetime.now(timezone.utc) - timedelta(seconds=30)
    user = make_user(last_login_at=recent)

    await repository.record_login(user, email="ada@example.com", display_name="Ada Lovelace")

    assert user.last_login_at == recent
    assert session.flush_count == 0


async def test_stale_timestamp_is_refreshed(repository, session):
    stale = datetime.now(timezone.utc) - (LOGIN_STAMP_INTERVAL + timedelta(minutes=1))
    user = make_user(last_login_at=stale)

    await repository.record_login(user, email="ada@example.com", display_name="Ada Lovelace")

    assert user.last_login_at is not None
    assert user.last_login_at > stale
    assert session.flush_count == 1


async def test_repeated_calls_within_the_interval_write_once(repository, session):
    user = make_user(last_login_at=None)

    for _ in range(20):
        await repository.record_login(user, email="ada@example.com", display_name="Ada Lovelace")

    # One write for the initial stamp; the remaining nineteen are free.
    assert session.flush_count == 1


# ---------------------------------------------------------------------------
# Directory-owned fields still propagate
# ---------------------------------------------------------------------------


async def test_renamed_user_is_updated_even_when_timestamp_is_fresh(repository, session):
    """Entra owns the display name; a rename must not wait for the throttle."""
    user = make_user(last_login_at=datetime.now(timezone.utc), display_name="Ada Lovelace")

    await repository.record_login(user, email="ada@example.com", display_name="Ada King")

    assert user.display_name == "Ada King"
    assert session.flush_count == 1


async def test_changed_email_is_updated(repository, session):
    user = make_user(last_login_at=datetime.now(timezone.utc), email="old@example.com")

    await repository.record_login(user, email="new@example.com")

    assert user.email == "new@example.com"
    assert session.flush_count == 1


async def test_tenant_change_is_recorded(repository, session):
    """Multi-tenant: the same person may return via a different tenant."""
    user = make_user(last_login_at=datetime.now(timezone.utc), entra_tenant_id="tenant-1")

    await repository.record_login(user, entra_tenant_id="tenant-2")

    assert user.entra_tenant_id == "tenant-2"
    assert session.flush_count == 1


async def test_absent_values_do_not_blank_existing_fields(repository, session):
    """A token missing an optional claim must not erase what we already know."""
    user = make_user(last_login_at=datetime.now(timezone.utc), display_name="Ada Lovelace")

    await repository.record_login(user, email=None, display_name=None)

    assert user.display_name == "Ada Lovelace"
    assert user.email == "ada@example.com"
    assert session.flush_count == 0
