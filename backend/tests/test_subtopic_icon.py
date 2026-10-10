"""Subtopic icon: admin round-trip, public detail, and migration 002."""

import importlib.util
import pathlib

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations
from httpx import AsyncClient

from tests.test_subtopics import _subtopic_payload, _topic_payload

MIGRATION = (
    pathlib.Path(__file__).resolve().parents[1]
    / "alembic" / "versions" / "002_subtopic_icon.py"
)


async def test_subtopic_icon_round_trip(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    topic_resp = await async_client.post(
        "/api/v1/admin/topics", headers=headers, json=_topic_payload()
    )
    assert topic_resp.status_code == 201
    topic = topic_resp.json()

    created = await async_client.post(
        "/api/v1/admin/subtopics",
        headers=headers,
        json=_subtopic_payload(topic["id"], icon="f(x)"),
    )
    assert created.status_code == 201
    assert created.json()["icon"] == "f(x)"
    sub_id = created.json()["id"]

    updated = await async_client.put(
        f"/api/v1/admin/subtopics/{sub_id}", headers=headers, json={"icon": "Σ"}
    )
    assert updated.status_code == 200
    assert updated.json()["icon"] == "Σ"

    public = await async_client.get(f"/api/v1/topics/{topic['slug']}?locale=en")
    assert public.status_code == 200
    sub = next(s for s in public.json()["subtopics"] if s["id"] == sub_id)
    assert sub["icon"] == "Σ"

    rejected = await async_client.put(
        f"/api/v1/admin/subtopics/{sub_id}", headers=headers, json={"icon": None}
    )
    assert rejected.status_code == 422


async def test_subtopic_icon_defaults_to_empty(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    topic = (
        await async_client.post("/api/v1/admin/topics", headers=headers, json=_topic_payload())
    ).json()
    created = await async_client.post(
        "/api/v1/admin/subtopics", headers=headers, json=_subtopic_payload(topic["id"])
    )
    assert created.status_code == 201
    assert created.json()["icon"] == ""


def _load_migration():
    spec = importlib.util.spec_from_file_location("migration_002", MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _columns(conn) -> set[str]:
    return {c["name"] for c in sa.inspect(conn).get_columns("subtopics")}


def test_migration_002_upgrade_is_idempotent_and_downgrades(tmp_path):
    engine = sa.create_engine(f"sqlite:///{tmp_path / 'migration.db'}")
    migration = _load_migration()
    with engine.begin() as conn:
        conn.execute(sa.text("CREATE TABLE subtopics (id VARCHAR(36) PRIMARY KEY)"))
        with Operations.context(MigrationContext.configure(conn)):
            migration.upgrade()
            assert "icon" in _columns(conn)
            migration.upgrade()
            assert "icon" in _columns(conn)
            migration.downgrade()
            assert "icon" not in _columns(conn)
    engine.dispose()
