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
from app.schemas.subtopic import SubtopicCreate, SubtopicUpdate, SubtopicResponse
from app.utils import slugify

router = APIRouter(prefix="/api/v1/admin", tags=["admin-subtopics"])


@router.get("/topics/{topic_id}/subtopics", response_model=List[SubtopicResponse])
async def list_subtopics(
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    # Verify topic exists
    topic = await db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    result = await db.execute(
        select(Subtopic)
        .options(selectinload(Subtopic.lessons))
        .where(Subtopic.topic_id == topic_id)
        .order_by(Subtopic.sort_order)
    )
    return result.scalars().all()


@router.post("/subtopics", response_model=SubtopicResponse, status_code=status.HTTP_201_CREATED)
async def create_subtopic(
    body: SubtopicCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    # Verify parent topic exists
    topic = await db.get(Topic, body.topic_id)
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent topic not found")

    data = body.model_dump()
    if not data.get("slug"):
        data["slug"] = slugify(body.name_he)

    subtopic = Subtopic(**data)
    db.add(subtopic)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subtopic with this slug already exists",
        )

    result = await db.execute(
        select(Subtopic).options(selectinload(Subtopic.lessons)).where(Subtopic.id == subtopic.id)
    )
    return result.scalar_one()


@router.put("/subtopics/{subtopic_id}", response_model=SubtopicResponse)
async def update_subtopic(
    subtopic_id: uuid.UUID,
    body: SubtopicUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(Subtopic).options(selectinload(Subtopic.lessons)).where(Subtopic.id == subtopic_id)
    )
    subtopic = result.scalar_one_or_none()
    if subtopic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtopic not found")

    update_data = body.model_dump(exclude_unset=True)

    # Verify new parent topic if changing
    if "topic_id" in update_data:
        topic = await db.get(Topic, update_data["topic_id"])
        if topic is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent topic not found")

    for field, value in update_data.items():
        setattr(subtopic, field, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subtopic with this slug already exists",
        )

    result = await db.execute(
        select(Subtopic).options(selectinload(Subtopic.lessons)).where(Subtopic.id == subtopic_id)
    )
    return result.scalar_one()


@router.delete("/subtopics/{subtopic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtopic(
    subtopic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(Subtopic).where(Subtopic.id == subtopic_id))
    subtopic = result.scalar_one_or_none()
    if subtopic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtopic not found")

    await db.delete(subtopic)
    await db.commit()
