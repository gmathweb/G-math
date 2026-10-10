"""Tests for dashboard stats (admin) endpoint."""

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


# ── Get stats returns counts ──


async def test_get_stats(async_client: AsyncClient, admin_token: str):
    resp = await async_client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    for key in ("topics", "subtopics", "lessons", "hero_slides", "files"):
        assert key in data
        assert isinstance(data[key], int)
        assert data[key] >= 0


# ── Stats without auth → 401 ──


async def test_stats_no_auth(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/admin/stats")
    assert resp.status_code == 401


# ── Stats reflect changes after adding data ──


async def test_stats_reflect_changes(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Get baseline
    before = await async_client.get("/api/v1/admin/stats", headers=headers)
    assert before.status_code == 200
    topics_before = before.json()["topics"]

    # Add a topic
    await async_client.post(
        "/api/v1/admin/topics", headers=headers, json=_topic_payload()
    )

    # Get updated stats
    after = await async_client.get("/api/v1/admin/stats", headers=headers)
    assert after.status_code == 200
    assert after.json()["topics"] == topics_before + 1
