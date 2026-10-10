from __future__ import annotations

import asyncio
import os
import uuid
from pathlib import Path
from urllib.parse import quote, unquote

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.content import ContentFile, FileType
from app.models.lesson import Lesson
from app.services.presentations import extract_presentation, remove_owned_directory

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {".pptx", ".pdf", ".ggb", ".html", ".mp4", ".zip"}


def content_directory(record: ContentFile) -> Path:
    return Path(settings.media_root) / ".presentations" / str(record.lesson_id) / str(record.id)


def content_path(record: ContentFile) -> Path:
    prefix = f"/api/v1/presentations/{record.lesson_id}/{record.id}/"
    if record.file_url.startswith(prefix):
        directory = content_directory(record)
        if (directory / "original.zip").is_file():
            return directory / "original.zip"
        relative = unquote(record.file_url.removeprefix(prefix))
        return directory / "web" / relative
    root = Path(settings.media_root).resolve()
    path = (root / unquote(record.file_url.removeprefix("/media/content/"))).resolve()
    if not path.is_relative_to(root):
        raise HTTPException(404, "File not found")
    return path


def _validate_file(filename: str, size: int) -> None:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"File extension '{ext}' not allowed. "
                f"Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )
    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {MAX_FILE_SIZE // (1024 * 1024)} MB",
        )


async def save_upload(
    db: AsyncSession,
    file: UploadFile,
    lesson_id: uuid.UUID,
    file_type: FileType,
    display_name: str | None = None,
) -> ContentFile:
    """Save an uploaded file to disk and create a DB record."""
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id).with_for_update())
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )

    contents = await file.read(MAX_FILE_SIZE + 1)

    safe_name = os.path.basename(file.filename or "")
    if not safe_name or ".." in safe_name or "\\" in safe_name or safe_name.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid filename")

    _validate_file(safe_name, len(contents))
    is_zip = safe_name.lower().endswith(".zip")
    if is_zip and file_type != FileType.presentation:
        raise HTTPException(400, "ZIP uploads must be presentations")
    name = display_name.strip() if display_name is not None else ""
    if (is_zip and not name) or len(name) > 300:
        raise HTTPException(400, "Presentation name is required and must be at most 300 characters")
    if display_name is not None and not name:
        raise HTTPException(400, "Display name cannot be empty")
    name = name or os.path.splitext(safe_name)[0]
    if len(name) > 300:
        raise HTTPException(400, "Display name must be at most 300 characters")

    content_id = uuid.uuid4()
    directory = Path(settings.media_root) / ".presentations" / str(lesson_id) / str(content_id)
    entry_name = "index.html" if is_zip else safe_name
    file_url = f"/api/v1/presentations/{lesson_id}/{content_id}/{quote(entry_name)}"
    last_order = await db.scalar(
        select(func.max(ContentFile.sort_order)).where(ContentFile.lesson_id == lesson_id)
    )

    record = ContentFile(
        id=content_id,
        lesson_id=lesson_id,
        file_type=file_type,
        file_url=file_url,
        display_name=name,
        sort_order=(last_order + 1) if last_order is not None else 0,
    )
    try:
        if is_zip:
            extraction = asyncio.create_task(
                asyncio.to_thread(extract_presentation, contents, directory / "web")
            )
            try:
                await asyncio.shield(extraction)
            except asyncio.CancelledError:
                await extraction
                raise
            file_path = directory / "original.zip"
        else:
            (directory / "web").mkdir(parents=True)
            file_path = directory / "web" / safe_name
        async with aiofiles.open(file_path, "wb") as output:
            await output.write(contents)
        db.add(record)
        await db.commit()
    except BaseException:
        await db.rollback()
        await asyncio.to_thread(remove_owned_directory, directory)
        raise
    await db.refresh(record)
    return record


async def delete_file(db: AsyncSession, file_id: uuid.UUID) -> None:
    """Remove a content file record and its physical file from disk."""
    record = await db.get(ContentFile, file_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )

    await db.delete(record)
    await db.commit()
    await remove_content_storage(record)


async def remove_content_storage(record: ContentFile) -> None:
    if record.file_url.startswith("/api/v1/presentations/"):
        await asyncio.to_thread(remove_owned_directory, content_directory(record))
    else:
        disk_path = content_path(record)
        if disk_path.is_file():
            disk_path.unlink()


async def get_files_for_lesson(
    db: AsyncSession, lesson_id: uuid.UUID
) -> list[ContentFile]:
    """Return all content files for a lesson, ordered by sort_order."""
    result = await db.execute(
        select(ContentFile)
        .where(ContentFile.lesson_id == lesson_id)
        .order_by(ContentFile.sort_order, ContentFile.created_at, ContentFile.id)
    )
    return list(result.scalars().all())


async def get_all_files(db: AsyncSession) -> list[ContentFile]:
    """Return all content files with lesson info."""
    result = await db.execute(
        select(ContentFile)
        .options(selectinload(ContentFile.lesson))
        .order_by(ContentFile.created_at.desc())
    )
    return list(result.scalars().all())
