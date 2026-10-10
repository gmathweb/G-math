from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.lesson import Lesson
from app.models.subtopic import Subtopic


async def get_lesson_by_slug(db: AsyncSession, slug: str) -> Lesson | None:
    """Fetch a single published lesson by slug with content files and parent chain."""
    stmt = (
        select(Lesson)
        .where(Lesson.slug == slug, Lesson.is_published == True)  # noqa: E712
        .options(
            selectinload(Lesson.content_files),
            selectinload(Lesson.subtopic).selectinload(Subtopic.topic),
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
