from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hero import HeroSlide


async def get_active_slides(db: AsyncSession) -> list[HeroSlide]:
    """Fetch active hero slides ordered by sort_order."""
    stmt = (
        select(HeroSlide)
        .where(HeroSlide.is_active == True)  # noqa: E712
        .order_by(HeroSlide.sort_order)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
