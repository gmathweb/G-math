from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.lesson import Lesson


class FileType(str, enum.Enum):
    presentation = "presentation"
    worksheet = "worksheet"
    geogebra = "geogebra"
    video = "video"


class ContentFile(Base):
    """Content file attached to a lesson. No updated_at — files are replaced, not edited."""

    __tablename__ = "content_files"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    lesson_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_type: Mapped[FileType] = mapped_column(
        Enum(FileType, name="file_type_enum", create_constraint=True),
        nullable=False,
    )
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str] = mapped_column(String(300), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Relationships
    lesson: Mapped[Lesson] = relationship("Lesson", back_populates="content_files")

    def __repr__(self) -> str:
        return f"<ContentFile {self.display_name} ({self.file_type})>"
