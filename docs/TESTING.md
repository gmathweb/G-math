# 🧪 Testing Guide

## Running Tests

```bash
cd backend
pip install -r requirements.txt

# Run all tests
python -m pytest tests/ -v

# Run a specific test file
python -m pytest tests/test_auth.py -v

# Run a specific test by name
python -m pytest tests/ -k "test_login"

# Full tracebacks on failure
python -m pytest tests/ --tb=long

# Run with coverage (if installed)
python -m pytest tests/ --cov=app --cov-report=term-missing
```

## Test Structure

```
backend/tests/
├── conftest.py          # Fixtures: async client, DB, admin token
├── test_auth.py         # 10 tests: password hashing, JWT, login, /me
├── test_files.py        # 6 tests: upload, validation, path traversal protection
├── test_topics_api.py   # 8 tests: CRUD, public filtering, slug generation
└── test_hero.py         # 5 tests: hero slides CRUD, active filter, reorder
```

## Key Fixtures (from conftest.py)

### `async_client`

An `httpx.AsyncClient` connected to the FastAPI app via ASGI transport. No network calls — everything runs in-process.

```python
async def test_example(async_client: AsyncClient):
    response = await async_client.get("/api/v1/topics")
    assert response.status_code == 200
```

### `db_session`

A clean SQLAlchemy `AsyncSession` using SQLite in-memory. Each test gets its own session that rolls back after the test.

```python
async def test_example(db_session: AsyncSession):
    topic = Topic(name_he="Test", ...)
    db_session.add(topic)
    await db_session.commit()
```

### `admin_token`

A valid JWT for an auto-created admin user. Use for any endpoint requiring authentication.

```python
async def test_example(async_client: AsyncClient, admin_token: str):
    response = await async_client.get(
        "/api/v1/admin/topics",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
```

## Writing New Tests

### Basic pattern

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_topic(async_client: AsyncClient, admin_token: str):
    response = await async_client.post(
        "/api/v1/admin/topics",
        json={
            "name_he": "אלגברה",
            "name_en": "Algebra",
            "name_ar": "الجبر",
            "icon": "➕",
            "color": "#6366f1",
            "bg_color": "#EEF2FF",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name_he"] == "אלגברה"
    assert data["slug"]  # auto-generated from name_he
```

### Testing unauthorized access

```python
@pytest.mark.asyncio
async def test_admin_requires_auth(async_client: AsyncClient):
    response = await async_client.get("/api/v1/admin/topics")
    assert response.status_code == 401
```

### Testing public endpoints with locale

```python
@pytest.mark.asyncio
async def test_topics_locale(async_client: AsyncClient):
    response = await async_client.get("/api/v1/topics?locale=en")
    assert response.status_code == 200
    # Names should be in English
```

### Testing file uploads

```python
@pytest.mark.asyncio
async def test_upload_file(async_client: AsyncClient, admin_token: str):
    response = await async_client.post(
        "/api/v1/admin/files/upload",
        data={"lesson_id": str(lesson_id), "file_type": "presentation"},
        files={"file": ("test.pdf", b"fake-content", "application/pdf")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
```

## Test Conventions

| Convention | Details |
|------------|---------|
| Database | SQLite (fast, in-memory) — not PostgreSQL |
| Isolation | Each test gets a fresh DB session with rollback |
| Async | All tests use `@pytest.mark.asyncio` |
| Fixtures | Always use fixtures from `conftest.py` |
| Naming | `test_<what_it_tests>` — be descriptive |
| Auth | Use `admin_token` fixture for protected endpoints |

## Test Dependencies

Already included in `requirements.txt`:

```
pytest>=8.0.0
pytest-asyncio>=0.23.0
httpx>=0.27.0
aiosqlite>=0.20.0
```

No additional installs needed.

## How the Test DB Works

1. **Session setup:** `conftest.py` creates all tables in SQLite once per test run
2. **Per-test:** Each test gets a `db_session` that rolls back after the test
3. **Dependency override:** `app.dependency_overrides[get_db]` points to the test DB
4. **Cleanup:** After all tests, tables are dropped and `test.db` is deleted

The test environment variables are set before any app imports:

```python
os.environ["JWT_SECRET"] = "test-secret-for-testing-only"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["MEDIA_ROOT"] = "tests/_test_media"
```

## Adding a New Test File

1. Create `backend/tests/test_<feature>.py`
2. Import fixtures — they're auto-discovered from `conftest.py`
3. Use `@pytest.mark.asyncio` on all test functions
4. Run with `python -m pytest tests/test_<feature>.py -v`

---

## Frontend Testing

### Current State

The **admin-frontend** (`admin-frontend/`) does not yet have a test runner configured. The **student frontend** (`frontend/`) also lacks formal tests. Both are candidates for future test infrastructure.

### Recommended Stack

| Tool              | Purpose                                |
|-------------------|----------------------------------------|
| Vitest            | Unit & component tests (fast, Vite-native) |
| Testing Library   | React component testing utilities      |
| Playwright        | End-to-end browser tests               |

### Key Test Scenarios (Admin Frontend)

| Scenario               | Type     | Description                                           |
|------------------------|----------|-------------------------------------------------------|
| Login flow             | E2E      | Admin login → JWT stored → redirect to dashboard      |
| Topic CRUD forms       | Unit/E2E | Create, edit, delete topics with validation           |
| Cascading selects      | Unit     | Topic → Subtopic → Lesson dropdown filtering          |
| File upload            | E2E      | Upload file to lesson, verify display & download      |
| Settings page          | Unit     | Load settings, edit, save, verify toast               |
| Auth guard             | Unit     | Unauthenticated users redirected to login             |

### Getting Started (Future)

```bash
cd admin-frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npx vitest --run
```

---

## Test Count Summary

| Suite                | Test Count | Notes                           |
|----------------------|------------|---------------------------------|
| `test_auth.py`       | 10         | Password hashing, JWT, login    |
| `test_files.py`      | 6          | Upload, validation, path safety |
| `test_topics_api.py` | 8          | CRUD, public filtering, slugs   |
| `test_hero.py`       | 5          | Hero slides CRUD, reorder       |
| New backend tests    | ~26+       | Settings, stats, lessons, downloads |
| **Total (backend)**  | **~55+**   |                                 |
| Frontend tests       | 0          | Not yet configured              |
