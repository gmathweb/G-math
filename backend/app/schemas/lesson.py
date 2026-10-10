import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.content import FileType


class ContentFileBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_type: FileType
    file_url: str
    display_name: str
    sort_order: int


class LessonCreate(BaseModel):
    subtopic_id: uuid.UUID
    slug: Optional[str] = None
    name_he: str
    name_en: str
    name_ar: str
    sort_order: int = 0
    is_published: bool = True


class LessonUpdate(BaseModel):
    subtopic_id: Optional[uuid.UUID] = None
    slug: Optional[str] = None
    name_he: Optional[str] = None
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    sort_order: Optional[int] = None
    is_published: Optional[bool] = None


class LessonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    subtopic_id: uuid.UUID
    slug: str
    name_he: str
    name_en: str
    name_ar: str
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    content_files: List[ContentFileBrief] = []
