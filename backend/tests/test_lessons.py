"""Tests for lesson CRUD (admin) endpoints."""

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


def _lesson_payload(subtopic_id: str, **overrides) -> dict:
    base = {
        "subtopic_id": subtopic_id,
        "name_he": f"שיעור-{uuid.uuid4().hex[:6]}",
        "name_en": f"Lesson-{uuid.uuid4().hex[:6]}",
        "name_ar": f"درس-{uuid.uuid4().hex[:6]}",
        "sort_order": 0,
        "is_published": True,
    }
    base.update(overrides)
    return base


async def _create_topic_and_subtopic(
    client: AsyncClient, token: str
) -> tuple:
    """Helper: create a topic + subtopic, return (topic_json, subtopic_json)."""
    headers = {"Authorization": f"Bearer {token}"}

    topic_resp = await client.post(
        "/api/v1/admin/topics", headers=headers, json=_topic_payload()
    )
    assert topic_resp.status_code == 201
    topic = topic_resp.json()

    sub_resp = await client.post(
        "/api/v1/admin/subtopics",
        headers=headers,
        json=_subtopic_payload(topic["id"]),
    )
    assert sub_resp.status_code == 201
    subtopic = sub_resp.json()

    return topic, subtopic


# ── Create lesson ──


async def test_create_lesson(async_client: AsyncClient, admin_token: str):
    _, subtopic = await _create_topic_and_subtopic(async_client, admin_token)
    payload = _lesson_payload(subtopic["id"])

    resp = await async_client.post(
        "/api/v1/admin/lessons",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=payload,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name_en"] == payload["name_en"]
    assert data["subtopic_id"] == subtopic["id"]
    assert "id" in data


# ── List all lessons (GET /admin/lessons) ──


async def test_list_all_lessons(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    _, subtopic = await _create_topic_and_subtopic(async_client, admin_token)

    await async_client.post(
        "/api/v1/admin/lessons",
        headers=headers,
        json=_lesson_payload(subtopic["id"]),
    )

    resp = await async_client.get("/api/v1/admin/lessons", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1


# ── List lessons filtered by topic_id ──


async def test_list_lessons_by_topic(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    topic, subtopic = await _create_topic_and_subtopic(async_client, admin_token)

    await async_client.post(
        "/api/v1/admin/lessons",
        headers=headers,
        json=_lesson_payload(subtopic["id"]),
    )

    resp = await async_client.get(
        f"/api/v1/admin/lessons?topic_id={topic['id']}",
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1


# ── List lessons filtered by subtopic_id ──


async def test_list_lessons_by_subtopic(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    _, subtopic = await _create_topic_and_subtopic(async_client, admin_token)

    create_resp = await async_client.post(
        "/api/v1/admin/lessons",
        headers=headers,
        json=_lesson_payload(subtopic["id"]),
    )
    assert create_resp.status_code == 201

    resp = await async_client.get(
        f"/api/v1/admin/lessons?subtopic_id={subtopic['id']}",
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    # All returned lessons belong to this subtopic
    for item in data:
        assert item["subtopic_id"] == subtopic["id"]


# ── Update lesson ──


async def test_update_lesson(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    _, subtopic = await _create_topic_and_subtopic(async_client, admin_token)

    create_resp = await async_client.post(
        "/api/v1/admin/lessons",
        headers=headers,
        json=_lesson_payload(subtopic["id"]),
    )
    lesson_id = create_resp.json()["id"]

    update_resp = await async_client.put(
        f"/api/v1/admin/lessons/{lesson_id}",
        headers=headers,
        json={"name_en": "Updated Lesson Name"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name_en"] == "Updated Lesson Name"


# ── Delete lesson ──


async def test_delete_lesson(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    _, subtopic = await _create_topic_and_subtopic(async_client, admin_token)

    create_resp = await async_client.post(
        "/api/v1/admin/lessons",
        headers=headers,
        json=_lesson_payload(subtopic["id"]),
    )
    lesson_id = create_resp.json()["id"]

    del_resp = await async_client.delete(
        f"/api/v1/admin/lessons/{lesson_id}",
        headers=headers,
    )
    assert del_resp.status_code == 204

    # Verify it's gone
    get_resp = await async_client.put(
        f"/api/v1/admin/lessons/{lesson_id}",
        headers=headers,
        json={"name_en": "Should fail"},
    )
    assert get_resp.status_code == 404


# ── Create lesson without auth → 401 ──


async def test_create_lesson_no_auth(async_client: AsyncClient, admin_token: str):
    _, subtopic = await _create_topic_and_subtopic(async_client, admin_token)
    resp = await async_client.post(
        "/api/v1/admin/lessons",
        json=_lesson_payload(subtopic["id"]),
    )
    assert resp.status_code == 401


# ── Cascade: deleting subtopic removes its lessons ──


async def test_cascade_delete_subtopic_removes_lessons(
    async_client: AsyncClient, admin_token: str
):
    headers = {"Authorization": f"Bearer {admin_token}"}
    _, subtopic = await _create_topic_and_subtopic(async_client, admin_token)

    create_resp = await async_client.post(
        "/api/v1/admin/lessons",
        headers=headers,
        json=_lesson_payload(subtopic["id"]),
    )
    lesson_id = create_resp.json()["id"]

    # Delete the parent subtopic
    del_resp = await async_client.delete(
        f"/api/v1/admin/subtopics/{subtopic['id']}",
        headers=headers,
    )
    assert del_resp.status_code == 204

    # Lesson should be gone (update returns 404)
    get_resp = await async_client.put(
        f"/api/v1/admin/lessons/{lesson_id}",
        headers=headers,
        json={"name_en": "Should fail"},
    )
    assert get_resp.status_code == 404
