import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.lesson import ContentFileBrief


class LessonListItem(BaseModel):
    """Lesson with topic/subtopic names for flat listing."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    subtopic_id: uuid.UUID
    topic_id: Optional[uuid.UUID] = None
    slug: str
    name_he: str
    name_en: str
    name_ar: str
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    content_files: List[ContentFileBrief] = []

    topic_name: Optional[str] = None
    subtopic_name: Optional[str] = None
