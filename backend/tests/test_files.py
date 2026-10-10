"""Tests for the file upload / list / delete endpoints."""

import io
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import ContentFile, FileType
from app.models.lesson import Lesson
from app.models.subtopic import Subtopic
from app.models.topic import Topic


async def _seed_lesson(db: AsyncSession) -> uuid.UUID:
    """Create a minimal topic → subtopic → lesson chain, return lesson.id."""
    topic = Topic(
        slug=f"t-{uuid.uuid4().hex[:8]}",
        icon="📐",
        color="#000",
        bg_color="#fff",
        name_he="נושא",
        name_en="Topic",
        name_ar="موضوع",
    )
    db.add(topic)
    await db.flush()

    sub = Subtopic(
        topic_id=topic.id,
        slug=f"s-{uuid.uuid4().hex[:8]}",
        name_he="תת",
        name_en="Sub",
        name_ar="فرعي",
    )
    db.add(sub)
    await db.flush()

    lesson = Lesson(
        subtopic_id=sub.id,
        slug=f"l-{uuid.uuid4().hex[:8]}",
        name_he="שיעור",
        name_en="Lesson",
        name_ar="درس",
    )
    db.add(lesson)
    await db.commit()
    return lesson.id


# ── Upload valid file ──


async def test_upload_valid_file(
    async_client: AsyncClient, db_session: AsyncSession, admin_token: str
):
    lesson_id = await _seed_lesson(db_session)
    file_content = b"PK\x03\x04dummy-pptx-bytes"
    resp = await async_client.post(
        "/api/v1/admin/files/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("slides.pptx", io.BytesIO(file_content), "application/octet-stream")},
        data={"lesson_id": str(lesson_id), "file_type": "presentation"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["display_name"] == "slides"
    assert data["file_type"] == "presentation"


# ── Reject disallowed extension ──


async def test_upload_invalid_extension(
    async_client: AsyncClient, db_session: AsyncSession, admin_token: str
):
    lesson_id = await _seed_lesson(db_session)
    resp = await async_client.post(
        "/api/v1/admin/files/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("malware.exe", io.BytesIO(b"evil"), "application/octet-stream")},
        data={"lesson_id": str(lesson_id), "file_type": "presentation"},
    )
    assert resp.status_code == 400
    assert "not allowed" in resp.json()["detail"]


# ── Path traversal is sanitized ──


async def test_upload_path_traversal(
    async_client: AsyncClient, db_session: AsyncSession, admin_token: str
):
    lesson_id = await _seed_lesson(db_session)
    resp = await async_client.post(
        "/api/v1/admin/files/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={
            "file": ("../../evil.pptx", io.BytesIO(b"PK\x03\x04data"), "application/octet-stream")
        },
        data={"lesson_id": str(lesson_id), "file_type": "presentation"},
    )
    # The server should either sanitize or reject; both are acceptable
    assert resp.status_code in (201, 400)
    if resp.status_code == 201:
        assert ".." not in resp.json()["file_url"]


# ── Auth required ──


async def test_upload_requires_auth(async_client: AsyncClient):
    resp = await async_client.post(
        "/api/v1/admin/files/upload",
        files={"file": ("doc.pptx", io.BytesIO(b"data"), "application/octet-stream")},
        data={"lesson_id": str(uuid.uuid4()), "file_type": "presentation"},
    )
    assert resp.status_code == 401


# ── List files ──


async def test_list_files(async_client: AsyncClient, admin_token: str):
    resp = await async_client.get(
        "/api/v1/admin/files",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ── Delete file ──


async def test_delete_file(
    async_client: AsyncClient, db_session: AsyncSession, admin_token: str
):
    lesson_id = await _seed_lesson(db_session)
    # Upload first
    upload_resp = await async_client.post(
        "/api/v1/admin/files/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("to_delete.pdf", io.BytesIO(b"%PDF-data"), "application/octet-stream")},
        data={"lesson_id": str(lesson_id), "file_type": "worksheet"},
    )
    assert upload_resp.status_code == 201
    file_id = upload_resp.json()["id"]

    # Delete
    del_resp = await async_client.delete(
        f"/api/v1/admin/files/{file_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_resp.status_code == 204
