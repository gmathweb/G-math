"""Bundled lesson presentations are attached once and never restored after admin changes."""

import uuid

from sqlalchemy import select

from app.models.content import ContentFile, FileType
from app.models.lesson import Lesson
from app.services.files import content_directory, delete_file
from seeds import seed_data
from seeds.seed_data import LESSON_PRESENTATIONS, PRESENTATIONS_DIR, seed_lesson_presentations
from tests.test_files import _seed_lesson


def test_bundled_presentations_point_at_shipped_zips():
    for item in LESSON_PRESENTATIONS:
        assert (PRESENTATIONS_DIR / item["zip"]).is_file()
        assert item["display_name"].strip()


async def _lesson_files(db, lesson_id):
    result = await db.execute(select(ContentFile).where(ContentFile.lesson_id == lesson_id))
    return list(result.scalars().all())


async def test_seed_attaches_presentation_once(db_session, monkeypatch, async_client):
    lesson_id = await _seed_lesson(db_session)
    lesson = await db_session.get(Lesson, lesson_id)
    zip_name = LESSON_PRESENTATIONS[0]["zip"]
    monkeypatch.setattr(seed_data, "LESSON_PRESENTATIONS", [
        {"lesson_slug": lesson.slug, "zip": zip_name, "display_name": "גורם משותף"},
        {"lesson_slug": f"missing-{uuid.uuid4().hex[:8]}", "zip": f"x-{uuid.uuid4().hex}.zip",
         "display_name": "missing"},
    ])

    assert await seed_lesson_presentations(db_session) == 1
    files = await _lesson_files(db_session, lesson_id)
    assert len(files) == 1
    record = files[0]
    assert record.file_type == FileType.presentation
    assert record.display_name == "גורם משותף"
    assert (content_directory(record) / "web" / "index.html").is_file()
    page = await async_client.get(record.file_url)
    assert page.status_code == 200
    assert "data/player.js" in page.text

    assert await seed_lesson_presentations(db_session) == 0
    await delete_file(db_session, record.id)
    assert await seed_lesson_presentations(db_session) == 0
    assert await _lesson_files(db_session, lesson_id) == []
