"""Tests for topic CRUD (admin) and public listing endpoints."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


def _topic_payload(**overrides) -> dict:
    base = {
        "icon": "📐",
        "color": "#1a73e8",
        "bg_color": "#e3f2fd",
        "name_he": f"נושא-{uuid.uuid4().hex[:6]}",
        "name_en": f"Topic-{uuid.uuid4().hex[:6]}",
        "name_ar": f"موضوع-{uuid.uuid4().hex[:6]}",
        "description_he": "תיאור",
        "description_en": "Description",
        "description_ar": "وصف",
        "sort_order": 0,
        "is_published": True,
    }
    base.update(overrides)
    return base


# ── Public: empty list ──


async def test_list_topics_empty(async_client: AsyncClient):
    """If there are no published topics, the public endpoint returns a list."""
    resp = await async_client.get("/api/v1/topics")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ── Admin: create ──


async def test_create_topic(async_client: AsyncClient, admin_token: str):
    payload = _topic_payload()
    resp = await async_client.post(
        "/api/v1/admin/topics",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=payload,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name_en"] == payload["name_en"]
    assert "id" in data


# ── Admin: auth required ──


async def test_create_topic_requires_admin(async_client: AsyncClient):
    resp = await async_client.post(
        "/api/v1/admin/topics",
        json=_topic_payload(),
    )
    assert resp.status_code == 401


# ── Public: list returns published only ──


async def test_list_topics_public(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create one published and one unpublished
    await async_client.post(
        "/api/v1/admin/topics",
        headers=headers,
        json=_topic_payload(
            slug=f"pub-{uuid.uuid4().hex[:6]}",
            is_published=True,
        ),
    )
    await async_client.post(
        "/api/v1/admin/topics",
        headers=headers,
        json=_topic_payload(
            slug=f"draft-{uuid.uuid4().hex[:6]}",
            is_published=False,
        ),
    )

    resp = await async_client.get("/api/v1/topics")
    assert resp.status_code == 200
    slugs = [t["slug"] for t in resp.json()]
    # Draft slugs should not appear in public list
    for s in slugs:
        assert not s.startswith("draft-")


# ── Public: get by slug ──


async def test_get_topic_by_slug(async_client: AsyncClient, admin_token: str):
    slug = f"slug-{uuid.uuid4().hex[:6]}"
    await async_client.post(
        "/api/v1/admin/topics",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=_topic_payload(slug=slug),
    )

    resp = await async_client.get(f"/api/v1/topics/{slug}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == slug
    assert "subtopics" in data


# ── Public: 404 for missing slug ──


async def test_get_topic_not_found(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/topics/nonexistent-slug")
    assert resp.status_code == 404


# ── Admin: update ──


async def test_update_topic(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    create_resp = await async_client.post(
        "/api/v1/admin/topics",
        headers=headers,
        json=_topic_payload(slug=f"upd-{uuid.uuid4().hex[:6]}"),
    )
    topic_id = create_resp.json()["id"]

    update_resp = await async_client.put(
        f"/api/v1/admin/topics/{topic_id}",
        headers=headers,
        json={"name_en": "Updated Name"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name_en"] == "Updated Name"


# ── Admin: delete ──


async def test_delete_topic(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    create_resp = await async_client.post(
        "/api/v1/admin/topics",
        headers=headers,
        json=_topic_payload(slug=f"del-{uuid.uuid4().hex[:6]}"),
    )
    topic_id = create_resp.json()["id"]

    del_resp = await async_client.delete(
        f"/api/v1/admin/topics/{topic_id}",
        headers=headers,
    )
    assert del_resp.status_code == 204


async def test_admin_catalog_counts_include_drafts(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    topic = (await async_client.post(
        "/api/v1/admin/topics", headers=headers, json=_topic_payload(),
    )).json()
    assert topic["subtopic_count"] == 0
    assert topic["lesson_count"] == 0
    subtopic = (await async_client.post(
        "/api/v1/admin/subtopics", headers=headers,
        json={
            "topic_id": topic["id"], "slug": f"count-sub-{uuid.uuid4().hex[:6]}",
            "name_he": "משנה", "name_en": "Subtopic", "name_ar": "فرعي",
        },
    )).json()
    assert subtopic["lesson_count"] == 0
    for published in (True, False):
        response = await async_client.post(
            "/api/v1/admin/lessons", headers=headers,
            json={
                "subtopic_id": subtopic["id"], "slug": f"count-lesson-{uuid.uuid4().hex[:6]}",
                "name_he": "שיעור", "name_en": "Lesson", "name_ar": "درس",
                "is_published": published,
            },
        )
        assert response.status_code == 201

    topics = (await async_client.get("/api/v1/admin/topics", headers=headers)).json()
    record = next(item for item in topics if item["id"] == topic["id"])
    assert record["subtopic_count"] == 1
    assert record["lesson_count"] == 2
    subtopics = (await async_client.get(
        f"/api/v1/admin/topics/{topic['id']}/subtopics", headers=headers,
    )).json()
    assert subtopics[0]["lesson_count"] == 2

    updated = await async_client.put(
        f"/api/v1/admin/topics/{topic['id']}", headers=headers,
        json={"icon": "∫"},
    )
    assert updated.status_code == 200
    assert updated.json()["lesson_count"] == 2
    updated_subtopic = await async_client.put(
        f"/api/v1/admin/subtopics/{subtopic['id']}", headers=headers,
        json={"name_he": "משנה מעודכן"},
    )
    assert updated_subtopic.status_code == 200
    assert updated_subtopic.json()["lesson_count"] == 2

    public = (await async_client.get(f"/api/v1/topics/{topic['slug']}")).json()
    assert len(public["subtopics"][0]["lessons"]) == 1
