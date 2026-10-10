"""Tests for user management (admin) endpoints."""

import uuid

import pytest
from httpx import AsyncClient


def _user_payload(**overrides) -> dict:
    base = {
        "email": f"user-{uuid.uuid4().hex[:8]}@test.com",
        "password": "strong-pass-123",
        "full_name": f"Test User {uuid.uuid4().hex[:6]}",
        "role": "editor",
    }
    base.update(overrides)
    return base


# ── List users ──


async def test_list_users(async_client: AsyncClient, admin_token: str):
    resp = await async_client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    # At least the admin user exists
    assert len(data) >= 1


# ── Create user ──


async def test_create_user(async_client: AsyncClient, admin_token: str):
    payload = _user_payload()
    resp = await async_client.post(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=payload,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == payload["email"]
    assert data["full_name"] == payload["full_name"]
    assert data["role"] == "editor"
    assert "id" in data
    # Password must not be returned
    assert "password" not in data
    assert "hashed_password" not in data


# ── Create duplicate email → 409 ──


async def test_create_duplicate_user(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = _user_payload()

    resp1 = await async_client.post(
        "/api/v1/admin/users", headers=headers, json=payload
    )
    assert resp1.status_code == 201

    resp2 = await async_client.post(
        "/api/v1/admin/users", headers=headers, json=payload
    )
    assert resp2.status_code == 409


# ── Create user without auth → 401 ──


async def test_create_user_no_auth(async_client: AsyncClient):
    resp = await async_client.post(
        "/api/v1/admin/users",
        json=_user_payload(),
    )
    assert resp.status_code == 401


# ── List users without auth → 401 ──


async def test_list_users_no_auth(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/admin/users")
    assert resp.status_code == 401


# ── Created user can login ──


async def test_created_user_can_login(async_client: AsyncClient, admin_token: str):
    payload = _user_payload()
    create_resp = await async_client.post(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=payload,
    )
    assert create_resp.status_code == 201

    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
