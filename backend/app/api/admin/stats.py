from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.database import get_db
from app.models.content import ContentFile
from app.models.hero import HeroSlide
from app.models.lesson import Lesson
from app.models.subtopic import Subtopic
from app.models.topic import Topic
from app.models.user import User
from app.schemas.stats import StatsResponse

router = APIRouter(prefix="/api/v1/admin/stats", tags=["admin-stats"])


@router.get("", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Return aggregate counts of main entities."""
    topics = (await db.execute(select(func.count()).select_from(Topic))).scalar_one()
    subtopics = (await db.execute(select(func.count()).select_from(Subtopic))).scalar_one()
    lessons = (await db.execute(select(func.count()).select_from(Lesson))).scalar_one()
    hero_slides = (await db.execute(select(func.count()).select_from(HeroSlide))).scalar_one()
    files = (await db.execute(select(func.count()).select_from(ContentFile))).scalar_one()

    return StatsResponse(
        topics=topics,
        subtopics=subtopics,
        lessons=lessons,
        hero_slides=hero_slides,
        files=files,
    )
