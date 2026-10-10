from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.public import PublicSiteContent
from app.services.settings import get_all_settings
from app.services.site_content import build_site_content

router = APIRouter(prefix="/api/v1/site-content", tags=["site-content"])


@router.get("", response_model=PublicSiteContent)
async def read_site_content(
    locale: Literal["he", "en", "ar"] = Query("he"),
    db: AsyncSession = Depends(get_db),
):
    """Localized home-page texts (trust cards + About section)."""
    return build_site_content(await get_all_settings(db), locale)
