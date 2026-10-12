"""Serve the built React apps (public site at /, admin portal at /admin) from FastAPI."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException
from starlette.responses import Response
from starlette.types import Scope

WEB_ROOT = Path(__file__).resolve().parent.parent / "web"

_IMMUTABLE = "public, max-age=31536000, immutable"
_REVALIDATE = "no-cache"


class SPAStaticFiles(StaticFiles):
    """StaticFiles that falls back to index.html for client-side routes."""

    async def get_response(self, path: str, scope: Scope) -> Response:
        try:
            response = await super().get_response(path, scope)
        except HTTPException as exc:
            if exc.status_code != 404:
                raise
            # Missing assets (anything with a file extension) and API paths stay 404.
            if Path(path).suffix or path.startswith("api/"):
                raise
            response = await super().get_response("index.html", scope)

        is_hashed_asset = path.startswith("assets/")
        response.headers["Cache-Control"] = _IMMUTABLE if is_hashed_asset else _REVALIDATE
        return response


def mount_frontends(app: FastAPI, web_root: Path = WEB_ROOT) -> None:
    """Mount built frontends. Must run after all API routes are registered.

    The admin app is mounted first so /admin/* is not swallowed by the public SPA.
    Skipped silently when a build is absent (local dev, tests).
    """
    admin_dir = web_root / "admin"
    public_dir = web_root / "public"

    if (admin_dir / "index.html").is_file():
        app.mount("/admin", SPAStaticFiles(directory=admin_dir, html=True), name="admin-spa")
    if (public_dir / "index.html").is_file():
        app.mount("/", SPAStaticFiles(directory=public_dir, html=True), name="public-spa")
