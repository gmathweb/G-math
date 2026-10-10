"""Tests for hero slide CRUD (admin) and public listing."""

import uuid

import pytest
from httpx import AsyncClient


def _slide_payload(**overrides) -> dict:
    base = {
        "title_he": "כותרת",
        "title_en": f"Hero-{uuid.uuid4().hex[:6]}",
        "title_ar": "عنوان",
        "subtitle_he": "תת כותרת",
        "subtitle_en": "Subtitle",
        "subtitle_ar": "عنوان فرعي",
        "button_text_he": "לחץ",
        "button_text_en": "Click",
        "button_text_ar": "انقر",
        "button_link": "/topics",
        "sort_order": 0,
        "is_active": True,
    }
    base.update(overrides)
    return base


# ── Admin: empty list ──


async def test_list_hero_slides_empty(async_client: AsyncClient, admin_token: str):
    resp = await async_client.get(
        "/api/v1/admin/hero-slides",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ── Admin: create ──


async def test_create_hero_slide(async_client: AsyncClient, admin_token: str):
    payload = _slide_payload()
    resp = await async_client.post(
        "/api/v1/admin/hero-slides",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=payload,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title_en"] == payload["title_en"]
    assert "id" in data


# ── Public: only active slides ──


async def test_list_active_slides(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create one active, one inactive
    await async_client.post(
        "/api/v1/admin/hero-slides",
        headers=headers,
        json=_slide_payload(title_en="Active Slide", is_active=True),
    )
    await async_client.post(
        "/api/v1/admin/hero-slides",
        headers=headers,
        json=_slide_payload(title_en="Inactive Slide", is_active=False),
    )

    resp = await async_client.get("/api/v1/hero-slides")
    assert resp.status_code == 200
    titles = [s["title"] for s in resp.json()]
    assert "Inactive Slide" not in titles


# ── Admin: update ──


async def test_update_hero_slide(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    create_resp = await async_client.post(
        "/api/v1/admin/hero-slides",
        headers=headers,
        json=_slide_payload(),
    )
    slide_id = create_resp.json()["id"]

    update_resp = await async_client.put(
        f"/api/v1/admin/hero-slides/{slide_id}",
        headers=headers,
        json={"title_en": "Updated Title"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title_en"] == "Updated Title"


# ── Admin: delete ──


async def test_delete_hero_slide(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    create_resp = await async_client.post(
        "/api/v1/admin/hero-slides",
        headers=headers,
        json=_slide_payload(),
    )
    slide_id = create_resp.json()["id"]

    del_resp = await async_client.delete(
        f"/api/v1/admin/hero-slides/{slide_id}",
        headers=headers,
    )
    assert del_resp.status_code == 204
