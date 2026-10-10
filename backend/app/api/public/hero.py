from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.public import PublicHeroSlide
from app.services.hero import get_active_slides

router = APIRouter(prefix="/api/v1/hero-slides", tags=["hero"])


def _loc(obj: object, field: str, locale: str) -> str:
    return getattr(obj, f"{field}_{locale}")


@router.get("", response_model=list[PublicHeroSlide])
async def list_hero_slides(
    locale: Literal["he", "en", "ar"] = Query("he"),
    db: AsyncSession = Depends(get_db),
):
    slides = await get_active_slides(db)
    return [
        PublicHeroSlide(
            id=s.id,
            title=_loc(s, "title", locale),
            subtitle=_loc(s, "subtitle", locale),
            button_text=_loc(s, "button_text", locale),
            button_link=s.button_link,
            sort_order=s.sort_order,
        )
        for s in slides
    ]
