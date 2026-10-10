from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.subtopic import Subtopic
    from app.models.content import ContentFile


class Lesson(BaseModel):
    __tablename__ = "lessons"

    subtopic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subtopics.id", ondelete="CASCADE"), nullable=False, index=True
    )
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    name_he: Mapped[str] = mapped_column(String(200), nullable=False)
    name_en: Mapped[str] = mapped_column(String(200), nullable=False)
    name_ar: Mapped[str] = mapped_column(String(200), nullable=False)

    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    subtopic: Mapped[Subtopic] = relationship("Subtopic", back_populates="lessons")
    content_files: Mapped[list[ContentFile]] = relationship(
        "ContentFile", back_populates="lesson", cascade="all, delete-orphan",
        order_by="ContentFile.sort_order",
    )

    def __repr__(self) -> str:
        return f"<Lesson {self.slug}>"
