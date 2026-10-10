import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.content import FileType


class ContentFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    file_url: str
    file_type: FileType
    display_name: str
    sort_order: int
    lesson_id: uuid.UUID
    created_at: datetime


class ContentFileUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=300)

    @field_validator("display_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Display name cannot be empty")
        return value


class ContentFileOrder(BaseModel):
    file_ids: list[uuid.UUID]
