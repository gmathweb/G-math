"""Tests for POST /api/v1/admin/import/topic."""

import uuid

import pytest_asyncio
from httpx import AsyncClient

from app.models.topic import Topic
from app.models.user import User, UserRole
from app.services.auth import create_access_token, hash_password

URL = "/api/v1/admin/import/topic"


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def topic_slug(db_session) -> str:
    slug = f"imp-{uuid.uuid4().hex[:8]}"
    db_session.add(Topic(
        slug=slug, icon="📐", color="#000", bg_color="#fff",
        name_he="נושא", name_en="Topic", name_ar="موضوع", is_published=True,
    ))
    await db_session.commit()
    return slug


def _body(topic: str, **sub_over) -> dict:
    sub = {
        "name_he": "ת", "name_en": "Law of Sines", "name_ar": "ق", "icon": "🅰️",
        "lessons": [{"name_he": "ש", "name_en": "Introduction", "name_ar": "م"}],
    }
    sub.update(sub_over)
    return {"topic_slug": topic, "subtopics": [sub]}


async def test_requires_auth(async_client: AsyncClient, topic_slug):
    assert (await async_client.post(URL, json=_body(topic_slug))).status_code == 401


async def test_non_admin_forbidden(async_client: AsyncClient, db_session, topic_slug):
    email = f"user-{uuid.uuid4().hex[:6]}@test.com"
    db_session.add(User(
        email=email, hashed_password=hash_password("x-pass-123"), full_name="U",
        role=UserRole.editor, is_active=True,
    ))
    await db_session.commit()
    token = create_access_token(data={"sub": email})
    res = await async_client.post(URL, json=_body(topic_slug), headers=_auth(token))
    assert res.status_code == 403


async def test_default_is_dry_run_and_writes_nothing(async_client, admin_token, topic_slug):
    res = await async_client.post(URL, json=_body(topic_slug), headers=_auth(admin_token))
    assert res.status_code == 200
    data = res.json()
    assert data["dry_run"] is True and data["applied"] is False
    assert data["created"] == {"subtopics": 1, "lessons": 1}
    pub = await async_client.get(f"/api/v1/topics/{topic_slug}")
    assert pub.json()["subtopics"] == []


async def test_apply_creates_rows_visible_via_public_topic_endpoint(async_client, admin_token, topic_slug):
    res = await async_client.post(
        URL + "?dry_run=false", json=_body(topic_slug), headers=_auth(admin_token)
    )
    assert res.status_code == 200 and res.json()["applied"] is True
    pub = (await async_client.get(f"/api/v1/topics/{topic_slug}")).json()
    assert len(pub["subtopics"]) == 1
    assert pub["subtopics"][0]["icon"] == "🅰️"
    assert len(pub["subtopics"][0]["lessons"]) == 1


async def test_unknown_topic_404(async_client, admin_token):
    res = await async_client.post(URL, json=_body("nope-nope"), headers=_auth(admin_token))
    assert res.status_code == 404


async def test_empty_name_422(async_client, admin_token, topic_slug):
    res = await async_client.post(URL, json=_body(topic_slug, name_en=""), headers=_auth(admin_token))
    assert res.status_code == 422


async def test_icon_too_long_422(async_client, admin_token, topic_slug):
    res = await async_client.post(URL, json=_body(topic_slug, icon="x" * 21), headers=_auth(admin_token))
    assert res.status_code == 422


async def test_duplicate_generated_slug_422(async_client, admin_token, topic_slug):
    body = _body(topic_slug)
    body["subtopics"].append(dict(body["subtopics"][0]))
    res = await async_client.post(URL, json=body, headers=_auth(admin_token))
    assert res.status_code == 422


async def test_conflict_409(async_client, admin_token, db_session, topic_slug):
    other = f"imp-{uuid.uuid4().hex[:8]}"
    db_session.add(Topic(
        slug=other, icon="📐", color="#000", bg_color="#fff",
        name_he="נושא", name_en="Topic", name_ar="موضوع",
    ))
    await db_session.commit()
    shared = f"shared-{uuid.uuid4().hex[:6]}"
    r1 = await async_client.post(
        URL + "?dry_run=false", json=_body(topic_slug, slug=shared), headers=_auth(admin_token)
    )
    assert r1.status_code == 200
    r2 = await async_client.post(URL, json=_body(other, slug=shared), headers=_auth(admin_token))
    assert r2.status_code == 409
