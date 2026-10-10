"""Tests for site settings (admin) endpoints."""

import uuid

import pytest
from httpx import AsyncClient


# ── Get settings ──


async def test_get_settings(async_client: AsyncClient, admin_token: str):
    resp = await async_client.get(
        "/api/v1/admin/settings",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "settings" in data
    assert isinstance(data["settings"], dict)


async def test_get_settings_fills_missing_home_defaults(async_client: AsyncClient, admin_token: str):
    from app.services.site_content import DEFAULT_SITE_CONTENT

    resp = await async_client.get(
        "/api/v1/admin/settings",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    settings = resp.json()["settings"]
    for key in DEFAULT_SITE_CONTENT:
        assert key in settings


# ── Update settings (upsert new keys) ──


async def test_update_settings_upsert(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    key = f"test_key_{uuid.uuid4().hex[:6]}"

    resp = await async_client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={"settings": {key: "value1"}},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["settings"][key] == "value1"


# ── Update settings overwrites existing keys ──


async def test_update_settings_overwrites(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    key = f"overwrite_{uuid.uuid4().hex[:6]}"

    # Set initial value
    await async_client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={"settings": {key: "original"}},
    )

    # Overwrite
    resp = await async_client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={"settings": {key: "updated"}},
    )
    assert resp.status_code == 200
    assert resp.json()["settings"][key] == "updated"


# ── Get settings without auth → 401 ──


async def test_get_settings_no_auth(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/admin/settings")
    assert resp.status_code == 401


# ── Put settings without auth → 401 ──


async def test_put_settings_no_auth(async_client: AsyncClient):
    resp = await async_client.put(
        "/api/v1/admin/settings",
        json={"settings": {"key": "val"}},
    )
    assert resp.status_code == 401


# ── Settings persist across requests ──


async def test_settings_persist(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    key = f"persist_{uuid.uuid4().hex[:6]}"

    # Write
    await async_client.put(
        "/api/v1/admin/settings",
        headers=headers,
        json={"settings": {key: "persisted_value"}},
    )

    # Read back in a separate request
    resp = await async_client.get("/api/v1/admin/settings", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["settings"][key] == "persisted_value"
