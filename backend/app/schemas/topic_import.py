from typing import List, Optional

from pydantic import BaseModel, Field, model_validator

MAX_SUBTOPICS = 100
MAX_LESSONS = 500


class LessonImport(BaseModel):
    slug: Optional[str] = Field(default=None, max_length=100)
    name_he: str = Field(min_length=1, max_length=200)
    name_en: str = Field(min_length=1, max_length=200)
    name_ar: str = Field(min_length=1, max_length=200)


class SubtopicImport(BaseModel):
    slug: Optional[str] = Field(default=None, max_length=100)
    name_he: str = Field(min_length=1, max_length=200)
    name_en: str = Field(min_length=1, max_length=200)
    name_ar: str = Field(min_length=1, max_length=200)
    icon: str = Field(default="", max_length=20)
    lessons: List[LessonImport] = Field(default_factory=list)


class TopicImportRequest(BaseModel):
    topic_slug: str = Field(min_length=1)
    subtopics: List[SubtopicImport] = Field(default_factory=list, max_length=MAX_SUBTOPICS)

    @model_validator(mode="after")
    def _limit_lessons(self):
        if sum(len(s.lessons) for s in self.subtopics) > MAX_LESSONS:
            raise ValueError(f"At most {MAX_LESSONS} lessons per import")
        return self


class ImportCounts(BaseModel):
    subtopics: int = 0
    lessons: int = 0


class DeletedCounts(ImportCounts):
    content_files: int = 0


class TopicImportResult(BaseModel):
    dry_run: bool
    applied: bool
    topic_slug: str
    created: ImportCounts
    updated: ImportCounts
    deleted: DeletedCounts
