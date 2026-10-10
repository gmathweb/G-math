from pydantic import field_validator
from pydantic_settings import BaseSettings

_WEAK_SECRETS = frozenset({
    "change-me-in-production",
    "dev-secret-change-me",
    "secret",
    "changeme",
})


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://gmath:gmath@localhost:5432/gmath"
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"
    environment: str = "development"

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    media_root: str = "/media/content"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @field_validator("jwt_secret")
    @classmethod
    def reject_weak_secrets(cls, v: str) -> str:
        if v in _WEAK_SECRETS:
            raise ValueError(
                f"JWT_SECRET is a known weak default ('{v}'). "
                "Set a strong, unique secret via the JWT_SECRET env variable."
            )
        return v

    class Config:
        env_file = ".env"


settings = Settings()
