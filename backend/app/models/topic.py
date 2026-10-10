from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.subtopic import Subtopic


class Topic(BaseModel):
    __tablename__ = "topics"

    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    icon: Mapped[str] = mapped_column(String(10), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False)
    bg_color: Mapped[str] = mapped_column(String(20), nullable=False)

    name_he: Mapped[str] = mapped_column(String(200), nullable=False)
    name_en: Mapped[str] = mapped_column(String(200), nullable=False)
    name_ar: Mapped[str] = mapped_column(String(200), nullable=False)

    description_he: Mapped[str] = mapped_column(Text, nullable=False, default="")
    description_en: Mapped[str] = mapped_column(Text, nullable=False, default="")
    description_ar: Mapped[str] = mapped_column(Text, nullable=False, default="")

    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    subtopics: Mapped[list[Subtopic]] = relationship(
        "Subtopic", back_populates="topic", cascade="all, delete-orphan",
        order_by="Subtopic.sort_order",
    )

    @property
    def subtopic_count(self) -> int:
        return len(self.subtopics)

    @property
    def lesson_count(self) -> int:
        return sum(len(subtopic.lessons) for subtopic in self.subtopics)

    def __repr__(self) -> str:
        return f"<Topic {self.slug}>"
