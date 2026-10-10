import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_admin
from app.database import get_db
from app.models.subtopic import Subtopic
from app.models.topic import Topic
from app.models.user import User
from app.schemas.topic import TopicCreate, TopicResponse, TopicUpdate
from app.utils import slugify

router = APIRouter(prefix="/api/v1/admin/topics", tags=["admin-topics"])


@router.get("", response_model=List[TopicResponse])
async def list_topics(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(Topic)
        .options(selectinload(Topic.subtopics).selectinload(Subtopic.lessons))
        .order_by(Topic.sort_order)
    )
    return result.scalars().all()


@router.post("", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
async def create_topic(
    body: TopicCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    data = body.model_dump()
    if not data.get("slug"):
        data["slug"] = slugify(body.name_he)

    topic = Topic(**data)
    db.add(topic)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Topic with this slug already exists",
        )

    result = await db.execute(
        select(Topic)
        .options(selectinload(Topic.subtopics).selectinload(Subtopic.lessons))
        .where(Topic.id == topic.id)
    )
    return result.scalar_one()


@router.put("/{topic_id}", response_model=TopicResponse)
async def update_topic(
    topic_id: uuid.UUID,
    body: TopicUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(Topic)
        .options(selectinload(Topic.subtopics).selectinload(Subtopic.lessons))
        .where(Topic.id == topic_id)
    )
    topic = result.scalar_one_or_none()
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(topic, field, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Topic with this slug already exists",
        )

    result = await db.execute(
        select(Topic)
        .options(selectinload(Topic.subtopics).selectinload(Subtopic.lessons))
        .where(Topic.id == topic_id)
    )
    return result.scalar_one()


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = result.scalar_one_or_none()
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    await db.delete(topic)
    await db.commit()
