from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.topic import Topic
    from app.models.lesson import Lesson


class Subtopic(BaseModel):
    __tablename__ = "subtopics"

    topic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True
    )
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    name_he: Mapped[str] = mapped_column(String(200), nullable=False)
    name_en: Mapped[str] = mapped_column(String(200), nullable=False)
    name_ar: Mapped[str] = mapped_column(String(200), nullable=False)
    icon: Mapped[str] = mapped_column(
        String(20), nullable=False, default="", server_default=""
    )

    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    topic: Mapped[Topic] = relationship("Topic", back_populates="subtopics")
    lessons: Mapped[list[Lesson]] = relationship(
        "Lesson", back_populates="subtopic", cascade="all, delete-orphan",
        order_by="Lesson.sort_order",
    )

    @property
    def lesson_count(self) -> int:
        return len(self.lessons)

    def __repr__(self) -> str:
        return f"<Subtopic {self.slug}>"
