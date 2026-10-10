from sqlalchemy import String, Integer, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class HeroSlide(BaseModel):
    __tablename__ = "hero_slides"

    title_he: Mapped[str] = mapped_column(String(300), nullable=False)
    title_en: Mapped[str] = mapped_column(String(300), nullable=False)
    title_ar: Mapped[str] = mapped_column(String(300), nullable=False)

    subtitle_he: Mapped[str] = mapped_column(Text, nullable=False, default="")
    subtitle_en: Mapped[str] = mapped_column(Text, nullable=False, default="")
    subtitle_ar: Mapped[str] = mapped_column(Text, nullable=False, default="")

    button_text_he: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    button_text_en: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    button_text_ar: Mapped[str] = mapped_column(String(100), nullable=False, default="")

    button_link: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<HeroSlide {self.title_en[:30]}>"
