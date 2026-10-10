from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.public import PublicContentFile, PublicLessonDetail
from app.services.lessons import get_lesson_by_slug

router = APIRouter(prefix="/api/v1/lessons", tags=["lessons"])


def _loc(obj: object, field: str, locale: str) -> str:
    return getattr(obj, f"{field}_{locale}")


@router.get("/{slug}", response_model=PublicLessonDetail)
async def get_lesson(
    slug: str,
    locale: Literal["he", "en", "ar"] = Query("he"),
    db: AsyncSession = Depends(get_db),
):
    lesson = await get_lesson_by_slug(db, slug)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )
    return PublicLessonDetail(
        id=lesson.id,
        slug=lesson.slug,
        name=_loc(lesson, "name", locale),
        sort_order=lesson.sort_order,
        subtopic_slug=lesson.subtopic.slug,
        topic_slug=lesson.subtopic.topic.slug,
        subtopic_name=_loc(lesson.subtopic, "name", locale),
        topic_name=_loc(lesson.subtopic.topic, "name", locale),
        content_files=[
            PublicContentFile.model_validate(cf) for cf in lesson.content_files
        ],
    )
