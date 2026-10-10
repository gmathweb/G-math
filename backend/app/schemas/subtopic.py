import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SubtopicCreate(BaseModel):
    topic_id: uuid.UUID
    slug: Optional[str] = None
    name_he: str
    name_en: str
    name_ar: str
    icon: str = Field(default="", max_length=20)
    sort_order: int = 0
    is_published: bool = True


class SubtopicUpdate(BaseModel):
    topic_id: Optional[uuid.UUID] = None
    slug: Optional[str] = None
    name_he: Optional[str] = None
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    # Not Optional: an explicit null is rejected (422) because the column is NOT NULL.
    icon: str = Field(default=None, max_length=20)
    sort_order: Optional[int] = None
    is_published: Optional[bool] = None


class LessonBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name_he: str
    name_en: str
    name_ar: str
    sort_order: int
    is_published: bool


class SubtopicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    topic_id: uuid.UUID
    slug: str
    name_he: str
    name_en: str
    name_ar: str
    icon: str = ""
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    lesson_count: int
    lessons: List[LessonBrief] = []
