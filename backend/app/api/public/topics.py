from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.public import (
    PublicLessonBrief,
    PublicSubtopicWithLessons,
    PublicTopicDetail,
    PublicTopicListItem,
)
from app.services.topics import get_published_topics, get_topic_by_slug

router = APIRouter(prefix="/api/v1/topics", tags=["topics"])


def _loc(obj: object, field: str, locale: str) -> str:
    """Resolve a locale-suffixed field (e.g. name_he) to its value."""
    return getattr(obj, f"{field}_{locale}")


@router.get("", response_model=list[PublicTopicListItem])
async def list_topics(
    locale: Literal["he", "en", "ar"] = Query("he"),
    db: AsyncSession = Depends(get_db),
):
    topics = await get_published_topics(db)
    return [
        PublicTopicListItem(
            id=t.id,
            slug=t.slug,
            icon=t.icon,
            color=t.color,
            bg_color=t.bg_color,
            name=_loc(t, "name", locale),
            description=_loc(t, "description", locale),
            sort_order=t.sort_order,
            subtopic_count=sum(1 for s in t.subtopics if s.is_published),
            lesson_count=sum(
                1
                for s in t.subtopics
                if s.is_published
                for le in s.lessons
                if le.is_published
            ),
        )
        for t in topics
    ]


@router.get("/{slug}", response_model=PublicTopicDetail)
async def get_topic(
    slug: str,
    locale: Literal["he", "en", "ar"] = Query("he"),
    db: AsyncSession = Depends(get_db),
):
    topic = await get_topic_by_slug(db, slug)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found"
        )
    return PublicTopicDetail(
        id=topic.id,
        slug=topic.slug,
        icon=topic.icon,
        color=topic.color,
        bg_color=topic.bg_color,
        name=_loc(topic, "name", locale),
        description=_loc(topic, "description", locale),
        sort_order=topic.sort_order,
        subtopics=[
            PublicSubtopicWithLessons(
                id=s.id,
                slug=s.slug,
                icon=s.icon,
                name=_loc(s, "name", locale),
                sort_order=s.sort_order,
                lessons=[
                    PublicLessonBrief(
                        id=le.id,
                        slug=le.slug,
                        name=_loc(le, "name", locale),
                        sort_order=le.sort_order,
                    )
                    for le in s.lessons
                    if le.is_published
                ],
            )
            for s in topic.subtopics
            if s.is_published
        ],
    )
