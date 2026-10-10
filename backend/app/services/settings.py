from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.site_config import SiteConfig


async def get_all_settings(db: AsyncSession) -> dict[str, str]:
    """Return all site config entries as a flat dict."""
    result = await db.execute(select(SiteConfig))
    rows = result.scalars().all()
    return {row.key: row.value for row in rows}


async def upsert_settings(db: AsyncSession, settings: dict[str, str]) -> dict[str, str]:
    """Upsert each key-value pair into site_config and return the full dict."""
    for key, value in settings.items():
        existing = await db.get(SiteConfig, key)
        if existing is not None:
            existing.value = value
        else:
            db.add(SiteConfig(key=key, value=value))

    await db.commit()
    return await get_all_settings(db)
