from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.database import get_db
from app.models.content import ContentFile, FileType
from app.models.lesson import Lesson
from app.models.user import User
from app.schemas.content import ContentFileOrder, ContentFileResponse, ContentFileUpdate
from app.services.files import (
    content_path,
    delete_file,
    get_all_files,
    get_files_for_lesson,
    save_upload,
)

router = APIRouter(prefix="/api/v1/admin/files", tags=["admin-files"])


@router.post("/upload", response_model=ContentFileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    lesson_id: uuid.UUID = Form(...),
    file_type: FileType = Form(...),
    display_name: Optional[str] = Form(None),  # noqa: UP045
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Upload a content file and attach it to a lesson."""
    record = await save_upload(db, file, lesson_id, file_type, display_name)
    return record


@router.get("", response_model=list[ContentFileResponse])
async def list_files(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List all content files."""
    return await get_all_files(db)


@router.get("/lesson/{lesson_id}", response_model=list[ContentFileResponse])
async def list_lesson_files(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List content files for a specific lesson."""
    return await get_files_for_lesson(db, lesson_id)


@router.put("/lesson/{lesson_id}/order", response_model=list[ContentFileResponse])
async def reorder_files(
    lesson_id: uuid.UUID,
    body: ContentFileOrder,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id).with_for_update())
    if result.scalar_one_or_none() is None:
        raise HTTPException(404, "Lesson not found")
    files = await get_files_for_lesson(db, lesson_id)
    if len(body.file_ids) != len(set(body.file_ids)) or set(body.file_ids) != {f.id for f in files}:
        raise HTTPException(400, "Order must contain every file of this lesson exactly once")
    by_id = {file.id: file for file in files}
    for index, file_id in enumerate(body.file_ids):
        by_id[file_id].sort_order = index
    await db.commit()
    return await get_files_for_lesson(db, lesson_id)


@router.patch("/{file_id}", response_model=ContentFileResponse)
async def rename_file(
    file_id: uuid.UUID,
    body: ContentFileUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    record = await db.get(ContentFile, file_id)
    if record is None:
        raise HTTPException(404, "File not found")
    record.display_name = body.display_name
    await db.commit()
    await db.refresh(record)
    return record


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_file(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Delete a content file record and its physical file."""
    await delete_file(db, file_id)


@router.get("/{file_id}/download")
async def download_file(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Stream a content file as a download."""
    record = await db.get(ContentFile, file_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )

    disk_path = content_path(record)

    if not disk_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on disk",
        )

    filename = (
        record.display_name.replace("/", "-").replace("\\", "-") + ".zip"
        if disk_path.name == "original.zip" else disk_path.name
    )

    return FileResponse(
        path=disk_path,
        filename=filename,
        media_type="application/octet-stream",
    )
