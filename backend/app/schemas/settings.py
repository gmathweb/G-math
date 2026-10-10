from pydantic import BaseModel


class SettingsResponse(BaseModel):
    settings: dict[str, str]


class SettingsUpdate(BaseModel):
    settings: dict[str, str]
