"""Shared test fixtures — sets env vars before any app imports."""

import os
import uuid

# ── Environment MUST be set before importing anything from the app ──
os.environ["JWT_SECRET"] = "test-secret-for-testing-only"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["MEDIA_ROOT"] = os.path.join(os.path.dirname(__file__), "_test_media")

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.services.auth import create_access_token, hash_password  # noqa: E402

# ── Test DB engine (SQLite, in-memory would lose data between connections) ──
TEST_DB_URL = "sqlite+aiosqlite:///./test.db"
engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ── Dependency override ──
async def _override_get_db():
    async with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = _override_get_db


# ── Session-scoped: create / drop tables once per test run ──
@pytest.fixture(scope="session", autouse=True)
async def _setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    # Clean up files
    if os.path.exists("test.db"):
        os.remove("test.db")
    import shutil
    media_dir = os.path.join(os.path.dirname(__file__), "_test_media")
    if os.path.isdir(media_dir):
        shutil.rmtree(media_dir)


# ── Per-test: rollback so tests stay isolated ──
@pytest_asyncio.fixture
async def db_session():
    async with TestSession() as session:
        yield session
        await session.rollback()


# ── Async HTTP client ──
@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ── Admin user + token ──
@pytest_asyncio.fixture
async def admin_token(db_session: AsyncSession) -> str:
    """Create a test admin user and return a valid JWT."""
    email = f"admin-{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        hashed_password=hash_password("admin-pass-123"),
        full_name="Test Admin",
        role=UserRole.admin,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return create_access_token(data={"sub": email})
