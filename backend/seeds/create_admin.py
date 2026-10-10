"""
Usage: python -m seeds.create_admin
Creates an admin user with password from ADMIN_PASSWORD env variable or secure prompt.
"""

from __future__ import annotations

import asyncio
import getpass
import os
import sys

from sqlalchemy import select

from app.database import engine, async_session, Base

# Import all models so Base.metadata knows about every table
import app.models  # noqa: F401

from app.models.user import User, UserRole
from app.services.auth import hash_password


async def main() -> None:
    email = os.getenv("ADMIN_EMAIL", "admin@g-math.co.il")
    password = os.getenv("ADMIN_PASSWORD")
    if not password:
        password = getpass.getpass("Enter admin password: ")
    if not password:
        print("❌  Password cannot be empty.")
        sys.exit(1)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        existing = await session.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none() is not None:
            print(f"⏭  User '{email}' already exists.")
            await engine.dispose()
            return

        admin = User(
            email=email,
            hashed_password=hash_password(password),
            full_name="Admin",
            role=UserRole.admin,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print(f"✅  Admin user '{email}' created.")

    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(130)
