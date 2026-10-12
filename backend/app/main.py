from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.logging_config import setup_logging, RequestIdMiddleware
from app.rate_limit import limiter
from app.spa import mount_frontends
from app.api.public.auth import router as auth_router
from app.api.public.topics import router as public_topics_router
from app.api.public.lessons import router as public_lessons_router
from app.api.public.hero import router as public_hero_router
from app.api.public.site_content import router as public_site_content_router
from app.api.public.presentations import router as presentations_router
from app.api.admin.topics import router as admin_topics_router
from app.api.admin.subtopics import router as admin_subtopics_router
from app.api.admin.lessons import router as admin_lessons_router
from app.api.admin.hero import router as admin_hero_router
from app.api.admin.users import router as admin_users_router
from app.api.admin.files import router as admin_files_router
from app.api.admin.settings import router as admin_settings_router
from app.api.admin.stats import router as admin_stats_router


def create_app() -> FastAPI:
    setup_logging()

    app = FastAPI(
        title="G-mathPOC API",
        description="Math learning platform API",
        version="0.1.0",
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(RequestIdMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Public routes
    app.include_router(auth_router)
    app.include_router(public_topics_router)
    app.include_router(public_lessons_router)
    app.include_router(public_hero_router)
    app.include_router(public_site_content_router)
    app.include_router(presentations_router)

    # Admin routes
    app.include_router(admin_topics_router)
    app.include_router(admin_subtopics_router)
    app.include_router(admin_lessons_router)
    app.include_router(admin_hero_router)
    app.include_router(admin_users_router)
    app.include_router(admin_files_router)
    app.include_router(admin_settings_router)
    app.include_router(admin_stats_router)

    @app.get("/api/v1/health")
    async def health(db: AsyncSession = Depends(get_db)):
        try:
            await db.execute(text("SELECT 1"))
            return {"status": "ok", "database": "connected"}
        except Exception as exc:
            return JSONResponse(
                status_code=503,
                content={"status": "unhealthy", "database": str(exc)},
            )

    # Must stay last: the "/" mount is a catch-all for the React SPA.
    mount_frontends(app)

    return app


app = create_app()
