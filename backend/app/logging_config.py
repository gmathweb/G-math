from __future__ import annotations

import logging
import logging.config
import uuid
from contextvars import ContextVar
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.config import settings

request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get("")  # type: ignore[attr-defined]
        return True


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request_id_ctx.set(rid)
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response


def setup_logging() -> None:
    is_production = settings.environment.lower() in ("production", "prod")

    if is_production:
        formatter_class = "pythonjsonlogger.json.JsonFormatter"
        fmt = "%(timestamp)s %(level)s %(name)s %(message)s %(request_id)s"
    else:
        formatter_class = "logging.Formatter"
        fmt = "%(asctime)s %(levelname)-8s [%(name)s] [%(request_id)s] %(message)s"

    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {
            "request_id": {
                "()": f"{__name__}.RequestIdFilter",
            },
        },
        "formatters": {
            "default": {
                "class": formatter_class,
                "format": fmt,
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "filters": ["request_id"],
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": "INFO",
            "handlers": ["console"],
        },
        "loggers": {
            "uvicorn": {"level": "INFO", "handlers": ["console"], "propagate": False},
            "sqlalchemy.engine": {"level": "WARNING", "handlers": ["console"], "propagate": False},
        },
    }

    logging.config.dictConfig(config)
