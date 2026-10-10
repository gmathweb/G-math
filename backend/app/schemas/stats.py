from pydantic import BaseModel


class StatsResponse(BaseModel):
    topics: int
    subtopics: int
    lessons: int
    hero_slides: int
    files: int
