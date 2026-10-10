from __future__ import annotations
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_admin
from app.database import get_db
from app.models.lesson import Lesson
from app.models.subtopic import Subtopic
from app.models.topic import Topic
from app.models.user import User
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse
from app.schemas.lesson_list import LessonListItem
from app.services.files import remove_content_storage
from app.utils import slugify

router = APIRouter(prefix="/api/v1/admin", tags=["admin-lessons"])


@router.get("/lessons", response_model=List[LessonListItem])
async def list_all_lessons(
    topic_id: Optional[uuid.UUID] = None,
    subtopic_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List lessons with optional topic/subtopic filtering. Includes parent names."""
    stmt = (
        select(Lesson)
        .join(Subtopic, Lesson.subtopic_id == Subtopic.id)
        .join(Topic, Subtopic.topic_id == Topic.id)
        .options(
            selectinload(Lesson.content_files),
            selectinload(Lesson.subtopic).selectinload(Subtopic.topic),
        )
    )

    if subtopic_id is not None:
        stmt = stmt.where(Lesson.subtopic_id == subtopic_id)
    elif topic_id is not None:
        stmt = stmt.where(Subtopic.topic_id == topic_id)

    stmt = stmt.order_by(Lesson.sort_order)
    result = await db.execute(stmt)
    lessons = result.scalars().unique().all()

    items = []
    for lesson in lessons:
        item = LessonListItem.model_validate(lesson)
        if lesson.subtopic:
            item.subtopic_name = lesson.subtopic.name_he
            if lesson.subtopic.topic:
                item.topic_id = lesson.subtopic.topic.id
                item.topic_name = lesson.subtopic.topic.name_he
        items.append(item)
    return items


@router.get("/subtopics/{subtopic_id}/lessons", response_model=List[LessonResponse])
async def list_lessons(
    subtopic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    subtopic = await db.get(Subtopic, subtopic_id)
    if subtopic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtopic not found")

    result = await db.execute(
        select(Lesson)
        .options(selectinload(Lesson.content_files))
        .where(Lesson.subtopic_id == subtopic_id)
        .order_by(Lesson.sort_order)
    )
    return result.scalars().all()


@router.post("/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    body: LessonCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    subtopic = await db.get(Subtopic, body.subtopic_id)
    if subtopic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent subtopic not found")

    data = body.model_dump()
    if not data.get("slug"):
        data["slug"] = slugify(body.name_he)

    lesson = Lesson(**data)
    db.add(lesson)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Lesson with this slug already exists",
        )

    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.content_files)).where(Lesson.id == lesson.id)
    )
    return result.scalar_one()


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: uuid.UUID,
    body: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.content_files)).where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    update_data = body.model_dump(exclude_unset=True)

    if "subtopic_id" in update_data:
        subtopic = await db.get(Subtopic, update_data["subtopic_id"])
        if subtopic is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent subtopic not found")

    for field, value in update_data.items():
        setattr(lesson, field, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Lesson with this slug already exists",
        )

    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.content_files)).where(Lesson.id == lesson_id)
    )
    return result.scalar_one()


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.content_files)).where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    files = list(lesson.content_files)
    await db.delete(lesson)
    await db.commit()
    for record in files:
        await remove_content_storage(record)
