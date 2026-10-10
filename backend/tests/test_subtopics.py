"""Tests for subtopic CRUD (admin) endpoints."""

import uuid

import pytest
from httpx import AsyncClient


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


def _subtopic_payload(topic_id: str, **overrides) -> dict:
    base = {
        "topic_id": topic_id,
        "name_he": f"תת-נושא-{uuid.uuid4().hex[:6]}",
        "name_en": f"Subtopic-{uuid.uuid4().hex[:6]}",
        "name_ar": f"موضوع-فرعي-{uuid.uuid4().hex[:6]}",
        "sort_order": 0,
        "is_published": True,
    }
    base.update(overrides)
    return base


async def _create_topic(client: AsyncClient, token: str) -> dict:
    """Helper: create a topic and return its JSON."""
    resp = await client.post(
        "/api/v1/admin/topics",
        headers={"Authorization": f"Bearer {token}"},
        json=_topic_payload(),
    )
    assert resp.status_code == 201
    return resp.json()


# ── Create subtopic ──


async def test_create_subtopic(async_client: AsyncClient, admin_token: str):
    topic = await _create_topic(async_client, admin_token)
    payload = _subtopic_payload(topic["id"])

    resp = await async_client.post(
        "/api/v1/admin/subtopics",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=payload,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name_en"] == payload["name_en"]
    assert data["topic_id"] == topic["id"]
    assert "id" in data


# ── List subtopics for a topic ──


async def test_list_subtopics(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    topic = await _create_topic(async_client, admin_token)

    # Create two subtopics
    for _ in range(2):
        resp = await async_client.post(
            "/api/v1/admin/subtopics",
            headers=headers,
            json=_subtopic_payload(topic["id"]),
        )
        assert resp.status_code == 201

    resp = await async_client.get(
        f"/api/v1/admin/topics/{topic['id']}/subtopics",
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2


# ── Update subtopic ──


async def test_update_subtopic(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    topic = await _create_topic(async_client, admin_token)

    create_resp = await async_client.post(
        "/api/v1/admin/subtopics",
        headers=headers,
        json=_subtopic_payload(topic["id"]),
    )
    subtopic_id = create_resp.json()["id"]

    update_resp = await async_client.put(
        f"/api/v1/admin/subtopics/{subtopic_id}",
        headers=headers,
        json={"name_en": "Updated Subtopic Name"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name_en"] == "Updated Subtopic Name"


# ── Delete subtopic ──


async def test_delete_subtopic(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    topic = await _create_topic(async_client, admin_token)

    create_resp = await async_client.post(
        "/api/v1/admin/subtopics",
        headers=headers,
        json=_subtopic_payload(topic["id"]),
    )
    subtopic_id = create_resp.json()["id"]

    del_resp = await async_client.delete(
        f"/api/v1/admin/subtopics/{subtopic_id}",
        headers=headers,
    )
    assert del_resp.status_code == 204

    # Verify it's gone
    get_resp = await async_client.put(
        f"/api/v1/admin/subtopics/{subtopic_id}",
        headers=headers,
        json={"name_en": "Should fail"},
    )
    assert get_resp.status_code == 404


# ── Create subtopic for non-existent topic → 404 ──


async def test_create_subtopic_nonexistent_topic(
    async_client: AsyncClient, admin_token: str
):
    fake_topic_id = str(uuid.uuid4())
    resp = await async_client.post(
        "/api/v1/admin/subtopics",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=_subtopic_payload(fake_topic_id),
    )
    assert resp.status_code == 404


# ── Create subtopic without auth → 401 ──


async def test_create_subtopic_no_auth(async_client: AsyncClient, admin_token: str):
    topic = await _create_topic(async_client, admin_token)
    resp = await async_client.post(
        "/api/v1/admin/subtopics",
        json=_subtopic_payload(topic["id"]),
    )
    assert resp.status_code == 401


# ── List subtopics without auth → 401 ──


async def test_list_subtopics_no_auth(async_client: AsyncClient, admin_token: str):
    topic = await _create_topic(async_client, admin_token)
    resp = await async_client.get(
        f"/api/v1/admin/topics/{topic['id']}/subtopics",
    )
    assert resp.status_code == 401


# ── Cascade: deleting topic removes its subtopics ──


async def test_cascade_delete_topic_removes_subtopics(
    async_client: AsyncClient, admin_token: str
):
    headers = {"Authorization": f"Bearer {admin_token}"}
    topic = await _create_topic(async_client, admin_token)

    create_resp = await async_client.post(
        "/api/v1/admin/subtopics",
        headers=headers,
        json=_subtopic_payload(topic["id"]),
    )
    subtopic_id = create_resp.json()["id"]

    # Delete the parent topic
    del_resp = await async_client.delete(
        f"/api/v1/admin/topics/{topic['id']}",
        headers=headers,
    )
    assert del_resp.status_code == 204

    # Subtopic should be gone (update returns 404)
    get_resp = await async_client.put(
        f"/api/v1/admin/subtopics/{subtopic_id}",
        headers=headers,
        json={"name_en": "Should fail"},
    )
    assert get_resp.status_code == 404
