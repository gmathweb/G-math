import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class HeroSlideCreate(BaseModel):
    title_he: str
    title_en: str
    title_ar: str
    subtitle_he: str = ""
    subtitle_en: str = ""
    subtitle_ar: str = ""
    button_text_he: str = ""
    button_text_en: str = ""
    button_text_ar: str = ""
    button_link: str = ""
    sort_order: int = 0
    is_active: bool = True


class HeroSlideUpdate(BaseModel):
    title_he: Optional[str] = None
    title_en: Optional[str] = None
    title_ar: Optional[str] = None
    subtitle_he: Optional[str] = None
    subtitle_en: Optional[str] = None
    subtitle_ar: Optional[str] = None
    button_text_he: Optional[str] = None
    button_text_en: Optional[str] = None
    button_text_ar: Optional[str] = None
    button_link: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class HeroSlideResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title_he: str
    title_en: str
    title_ar: str
    subtitle_he: str
    subtitle_en: str
    subtitle_ar: str
    button_text_he: str
    button_text_en: str
    button_text_ar: str
    button_link: str
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
