import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.database import get_db
from app.models.hero import HeroSlide
from app.models.user import User
from app.schemas.hero import HeroSlideCreate, HeroSlideUpdate, HeroSlideResponse

router = APIRouter(prefix="/api/v1/admin/hero-slides", tags=["admin-hero"])


class HeroSlideReorder(BaseModel):
    ordered_ids: List[uuid.UUID]


@router.get("", response_model=List[HeroSlideResponse])
async def list_hero_slides(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(HeroSlide).order_by(HeroSlide.sort_order))
    return result.scalars().all()


@router.post("", response_model=HeroSlideResponse, status_code=status.HTTP_201_CREATED)
async def create_hero_slide(
    body: HeroSlideCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    slide = HeroSlide(**body.model_dump())
    db.add(slide)
    await db.commit()
    await db.refresh(slide)
    return slide


@router.put("/reorder", response_model=List[HeroSlideResponse])
async def reorder_hero_slides(
    body: HeroSlideReorder,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(HeroSlide))
    slides_by_id = {s.id: s for s in result.scalars().all()}

    for idx, slide_id in enumerate(body.ordered_ids):
        slide = slides_by_id.get(slide_id)
        if slide is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Hero slide {slide_id} not found",
            )
        slide.sort_order = idx

    await db.commit()

    result = await db.execute(select(HeroSlide).order_by(HeroSlide.sort_order))
    return result.scalars().all()


@router.put("/{slide_id}", response_model=HeroSlideResponse)
async def update_hero_slide(
    slide_id: uuid.UUID,
    body: HeroSlideUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(HeroSlide).where(HeroSlide.id == slide_id))
    slide = result.scalar_one_or_none()
    if slide is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hero slide not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(slide, field, value)

    await db.commit()
    await db.refresh(slide)
    return slide


@router.delete("/{slide_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hero_slide(
    slide_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    result = await db.execute(select(HeroSlide).where(HeroSlide.id == slide_id))
    slide = result.scalar_one_or_none()
    if slide is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hero slide not found")

    await db.delete(slide)
    await db.commit()
