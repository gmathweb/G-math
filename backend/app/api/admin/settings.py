from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.database import get_db
from app.models.user import User
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.services.settings import get_all_settings, upsert_settings
from app.services.site_content import DEFAULT_SITE_CONTENT

router = APIRouter(prefix="/api/v1/admin/settings", tags=["admin-settings"])


@router.get("", response_model=SettingsResponse)
async def read_settings(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Return all site configuration as a dict.

    Home-content keys that were never saved are filled with the built-in defaults the public site
    already shows, so the admin form starts from the visible text instead of blanks.
    """
    data = await get_all_settings(db)
    return SettingsResponse(settings={**DEFAULT_SITE_CONTENT, **data})


@router.put("", response_model=SettingsResponse)
async def update_settings(
    body: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Upsert site configuration key-value pairs."""
    data = await upsert_settings(db, body.settings)
    return SettingsResponse(settings=data)
