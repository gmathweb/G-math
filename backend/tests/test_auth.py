"""Tests for authentication: password hashing, JWT tokens, login & /me endpoints."""

import uuid
from datetime import timedelta

import pytest
from httpx import AsyncClient
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.services.auth import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


# ── Unit: password hashing ──


def test_hash_and_verify_password():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed)


def test_verify_wrong_password():
    hashed = hash_password("mysecret")
    assert not verify_password("wrongpassword", hashed)


# ── Unit: JWT tokens ──


def test_create_and_decode_token():
    token = create_access_token(data={"sub": "user@example.com"})
    payload = decode_token(token)
    assert payload["sub"] == "user@example.com"
    assert "exp" in payload


def test_decode_invalid_token():
    with pytest.raises(JWTError):
        decode_token("not.a.valid.token")


def test_decode_expired_token():
    token = create_access_token(
        data={"sub": "user@example.com"},
        expires_delta=timedelta(seconds=-1),
    )
    with pytest.raises(JWTError):
        decode_token(token)


# ── Integration: login endpoint ──


async def test_login_success(async_client: AsyncClient, db_session: AsyncSession):
    email = f"login-ok-{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        hashed_password=hash_password("correct-password"),
        full_name="Login User",
        role=UserRole.admin,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "correct-password"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(async_client: AsyncClient, db_session: AsyncSession):
    email = f"login-bad-{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        hashed_password=hash_password("correct-password"),
        full_name="Bad Pass User",
        role=UserRole.admin,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrong-password"},
    )
    assert resp.status_code == 401


async def test_login_nonexistent_user(async_client: AsyncClient):
    resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@test.com", "password": "anything"},
    )
    assert resp.status_code == 401


# ── Integration: /me endpoint ──


async def test_me_authenticated(async_client: AsyncClient, admin_token: str):
    resp = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert data["role"] == "admin"


async def test_me_unauthenticated(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/auth/me")
    assert resp.status_code == 401
