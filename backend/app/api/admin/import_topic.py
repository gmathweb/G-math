from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.database import get_db
from app.models.user import User
from app.schemas.topic_import import TopicImportRequest, TopicImportResult
from app.services.topic_import import (
    ImportConflict,
    ImportValidationError,
    TopicNotFound,
    import_topic,
)

router = APIRouter(prefix="/api/v1/admin/import", tags=["admin-import"])


@router.post("/topic", response_model=TopicImportResult)
async def import_topic_endpoint(
    body: TopicImportRequest,
    dry_run: bool = Query(True, description="Preview only; nothing is written when true"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    try:
        return await import_topic(db, body, dry_run=dry_run)
    except TopicNotFound as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except ImportConflict as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))
    except ImportValidationError as e:
        raise HTTPException(422, detail=str(e))
