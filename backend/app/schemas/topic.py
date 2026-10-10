import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class TopicCreate(BaseModel):
    slug: Optional[str] = None
    icon: str
    color: str
    bg_color: str
    name_he: str
    name_en: str
    name_ar: str
    description_he: str = ""
    description_en: str = ""
    description_ar: str = ""
    sort_order: int = 0
    is_published: bool = True


class TopicUpdate(BaseModel):
    slug: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    bg_color: Optional[str] = None
    name_he: Optional[str] = None
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    description_he: Optional[str] = None
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    sort_order: Optional[int] = None
    is_published: Optional[bool] = None


class SubtopicBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name_he: str
    name_en: str
    name_ar: str
    sort_order: int
    is_published: bool


class TopicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    icon: str
    color: str
    bg_color: str
    name_he: str
    name_en: str
    name_ar: str
    description_he: str
    description_en: str
    description_ar: str
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    subtopic_count: int
    lesson_count: int
    subtopics: List[SubtopicBrief] = []
