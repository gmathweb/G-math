from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.subtopic import Subtopic
from app.models.topic import Topic


async def get_published_topics(db: AsyncSession) -> list[Topic]:
    """Fetch all published topics with subtopics and lessons eagerly loaded."""
    stmt = (
        select(Topic)
        .where(Topic.is_published == True)  # noqa: E712
        .options(selectinload(Topic.subtopics).selectinload(Subtopic.lessons))
        .order_by(Topic.sort_order)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_topic_by_slug(db: AsyncSession, slug: str) -> Topic | None:
    """Fetch a single published topic by slug with full subtopic/lesson tree."""
    stmt = (
        select(Topic)
        .where(Topic.slug == slug, Topic.is_published == True)  # noqa: E712
        .options(selectinload(Topic.subtopics).selectinload(Subtopic.lessons))
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
