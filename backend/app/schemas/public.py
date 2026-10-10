import uuid
from typing import List

from pydantic import BaseModel, ConfigDict

from app.models.content import FileType


class PublicContentFile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_type: FileType
    file_url: str
    display_name: str
    sort_order: int


class PublicLessonBrief(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    sort_order: int


class PublicSubtopicWithLessons(BaseModel):
    id: uuid.UUID
    slug: str
    icon: str = ""
    name: str
    sort_order: int
    lessons: List[PublicLessonBrief] = []


class PublicTopicListItem(BaseModel):
    id: uuid.UUID
    slug: str
    icon: str
    color: str
    bg_color: str
    name: str
    description: str
    sort_order: int
    subtopic_count: int
    lesson_count: int


class PublicTopicDetail(BaseModel):
    id: uuid.UUID
    slug: str
    icon: str
    color: str
    bg_color: str
    name: str
    description: str
    sort_order: int
    subtopics: List[PublicSubtopicWithLessons] = []


class PublicLessonDetail(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    sort_order: int
    subtopic_slug: str
    topic_slug: str
    subtopic_name: str
    topic_name: str
    content_files: List[PublicContentFile] = []


class PublicHeroSlide(BaseModel):
    id: uuid.UUID
    title: str
    subtitle: str
    button_text: str
    button_link: str
    sort_order: int


class PublicTrustCard(BaseModel):
    icon: str
    text: str


class PublicAbout(BaseModel):
    title: str
    body: str
    button_text: str
    button_link: str


class PublicSiteContent(BaseModel):
    trust_cards: List[PublicTrustCard]
    about: PublicAbout
