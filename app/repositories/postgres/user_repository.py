import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import AppUser

# How stale last_login_at may become before it is rewritten. See record_login:
# without this, every authenticated request issues an UPDATE.
LOGIN_STAMP_INTERVAL = timedelta(minutes=5)


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[AppUser]:
        return await self._session.get(AppUser, user_id)

    async def get_by_entra_object_id(self, entra_object_id: str) -> Optional[AppUser]:
        stmt = select(AppUser).where(AppUser.entra_object_id == entra_object_id)
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def list(
        self,
        *,
        limit: int,
        offset: int,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[list[AppUser], int]:
        stmt = select(AppUser)
        count_stmt = select(func.count()).select_from(AppUser)

        if search:
            pattern = f"%{search}%"
            condition = or_(AppUser.email.ilike(pattern), AppUser.display_name.ilike(pattern))
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)
        if is_active is not None:
            stmt = stmt.where(AppUser.is_active == is_active)
            count_stmt = count_stmt.where(AppUser.is_active == is_active)

        stmt = stmt.order_by(AppUser.created_at.desc()).limit(limit).offset(offset)

        total = (await self._session.execute(count_stmt)).scalar_one()
        items = (await self._session.execute(stmt)).scalars().all()
        return list(items), total

    async def provision(
        self,
        *,
        entra_object_id: str,
        entra_tenant_id: str,
        email: str,
        display_name: Optional[str],
        default_role: Optional[str],
    ) -> AppUser:
        """Return the user for these claims, creating the row on first sight.

        Two simultaneous first sign-ins by the same person both find no row
        and both attempt an insert. Rather than check-then-insert -- which
        races and produces duplicates -- the unique constraint on
        entra_object_id decides the winner, and the loser re-reads the row
        the winner committed.
        """
        existing = await self.get_by_entra_object_id(entra_object_id)
        if existing is not None:
            return existing

        user = AppUser(
            entra_object_id=entra_object_id,
            entra_tenant_id=entra_tenant_id,
            email=email,
            display_name=display_name,
            role=default_role,
        )

        try:
            # A SAVEPOINT, not a bare flush. If the insert violates the unique
            # constraint we must undo *only* the insert: calling
            # session.rollback() here would discard the entire request's
            # transaction, silently destroying any other write the caller had
            # already made. Provisioning happens to run first today, so that
            # would not bite yet -- which is exactly the kind of latent bug
            # that surfaces months later as mysterious lost data.
            #
            # Flush rather than commit throughout: the request owns the
            # transaction boundary (see get_db_session).
            async with self._session.begin_nested():
                self._session.add(user)
                await self._session.flush()
        except IntegrityError:
            # Lost the race to a concurrent first sign-in. The savepoint is
            # already rolled back; read the row the winner committed.
            winner = await self.get_by_entra_object_id(entra_object_id)
            if winner is None:
                # The constraint fired but no row exists, so the violation was
                # something other than the concurrent insert we expect.
                raise
            return winner

        return user

    async def record_login(
        self,
        user: AppUser,
        *,
        email: Optional[str] = None,
        display_name: Optional[str] = None,
        entra_tenant_id: Optional[str] = None,
    ) -> AppUser:
        """Stamp the sign-in and refresh directory-owned fields.

        Entra is authoritative for name and email, so a change there should
        propagate rather than leaving VistaIQ showing a stale value forever.

        The timestamp is throttled. This runs on every authenticated request,
        and stamping each one would mean an UPDATE per API call -- row
        contention on a single row per user, plus write-ahead log churn, for
        no information gained. It is also the wrong meaning: an API call is
        not a login. Writing at most once per interval keeps "roughly when
        this person was last active", which is what the column is for.
        """
        changed = False

        if email and email != user.email:
            user.email = email
            changed = True
        if display_name and display_name != user.display_name:
            user.display_name = display_name
            changed = True
        if entra_tenant_id and entra_tenant_id != user.entra_tenant_id:
            user.entra_tenant_id = entra_tenant_id
            changed = True

        now = datetime.now(timezone.utc)
        if user.last_login_at is None or (now - user.last_login_at) >= LOGIN_STAMP_INTERVAL:
            user.last_login_at = now
            changed = True

        # No flush when nothing changed, so the common case costs one SELECT
        # and no write at all.
        if changed:
            await self._session.flush()
        return user

    async def set_active(self, user: AppUser, *, is_active: bool) -> AppUser:
        user.is_active = is_active
        await self._session.flush()
        return user

    async def set_role(self, user: AppUser, *, role: Optional[str]) -> AppUser:
        user.role = role
        await self._session.flush()
        return user
