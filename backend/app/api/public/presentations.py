from __future__ import annotations

import asyncio
import re
import uuid
from pathlib import Path, PurePosixPath

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.content import ContentFile
from app.services.files import content_directory
from app.services.presentation_player import instrument_presentation, is_ispring_presentation

router = APIRouter(prefix="/api/v1/presentations", tags=["presentations"])
_SAFE_SOURCE = re.compile(r"https?://[A-Za-z0-9.\-]+(?::\d{1,5})?/[A-Za-z0-9/\-]+/")


@router.get("/player-bridge.js")
async def player_bridge():
    return FileResponse(
        Path(__file__).parents[2] / "static" / "presentation-player.js",
        media_type="application/javascript",
        headers={
            "Access-Control-Allow-Origin": "*",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
        },
    )


@router.get("/{lesson_id}/{file_id}/{asset_path:path}")
async def presentation_asset(
    lesson_id: uuid.UUID,
    file_id: uuid.UUID,
    asset_path: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(ContentFile, file_id)
    prefix = f"/api/v1/presentations/{lesson_id}/{file_id}/"
    if record is None or record.lesson_id != lesson_id or not record.file_url.startswith(prefix):
        raise HTTPException(404, "Presentation not found")
    relative = PurePosixPath(asset_path)
    if not asset_path or "\\" in asset_path or relative.is_absolute() or ".." in relative.parts:
        raise HTTPException(404, "Asset not found")
    root = (content_directory(record) / "web").resolve()
    path = (root / asset_path).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise HTTPException(404, "Asset not found")
    sandbox_policy = "" if path.suffix.lower() == ".pdf" else "sandbox allow-scripts; "
    # The sandbox origin is opaque, so 'self' alone blocks players (iSpring) that XHR
    # their own slide styles; allow fetches back into this presentation folder only.
    own_assets = f"{request.url.scheme}://{request.url.netloc}{prefix}"
    connect_src = "'self'"
    if _SAFE_SOURCE.fullmatch(own_assets):
        connect_src += f" {own_assets}"
    headers = {
        "Content-Security-Policy": sandbox_policy + (
            "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
            f"font-src 'self' data:; connect-src {connect_src}; "
            f"frame-ancestors 'self' {' '.join(settings.cors_origins_list)}; "
            "form-action 'none'; base-uri 'none'"
        ),
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
    }
    if path.suffix.lower() == ".html" and await asyncio.to_thread(is_ispring_presentation, path):
        return StreamingResponse(
            instrument_presentation(path), media_type="text/html", headers=headers
        )
    return FileResponse(path, headers=headers)
