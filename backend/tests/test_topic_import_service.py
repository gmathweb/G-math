"""Tests for the topic import service."""

import json
import uuid
from pathlib import Path

import pytest
from sqlalchemy import func, select

from app.models.content import ContentFile, FileType
from app.models.lesson import Lesson
from app.models.subtopic import Subtopic
from app.models.topic import Topic
from app.schemas.topic_import import TopicImportRequest
from app.services.topic_import import (
    ImportConflict,
    ImportValidationError,
    TopicNotFound,
    import_topic,
)


async def _topic(db, slug=None) -> Topic:
    slug = slug or f"t-{uuid.uuid4().hex[:8]}"
    topic = Topic(
        slug=slug, icon="📐", color="#000", bg_color="#fff",
        name_he="נושא", name_en="Topic", name_ar="موضوع",
    )
    db.add(topic)
    await db.commit()
    return topic


def _names(en: str) -> dict:
    return {"name_he": f"he {en}", "name_en": en, "name_ar": f"ar {en}"}


def _req(topic_slug: str, subtopics: list[dict]) -> TopicImportRequest:
    return TopicImportRequest.model_validate({"topic_slug": topic_slug, "subtopics": subtopics})


def _sub(en: str, lessons: list[str], **extra) -> dict:
    return {**_names(en), "icon": "📐", "lessons": [_names(x) for x in lessons], **extra}


async def _files_in(db, topic_slug: str) -> int:
    q = select(func.count()).select_from(ContentFile).join(
        Lesson, ContentFile.lesson_id == Lesson.id
    ).where(Lesson.slug.like(f"{topic_slug}--%"))
    return (await db.execute(q)).scalar_one()


async def _count(db, model) -> int:
    return (await db.execute(select(func.count()).select_from(model))).scalar_one()


async def test_creates_subtopics_and_lessons_with_generated_slugs(db_session):
    t = await _topic(db_session)
    res = await import_topic(
        db_session, _req(t.slug, [_sub("Law of Sines", ["Introduction", "Basic Problems"])]),
        dry_run=False,
    )
    assert res.created.subtopics == 1 and res.created.lessons == 2 and res.applied
    sub = (await db_session.execute(select(Subtopic).where(Subtopic.topic_id == t.id))).scalar_one()
    assert sub.slug == f"{t.slug}--law-of-sines"
    lessons = (
        await db_session.execute(
            select(Lesson).where(Lesson.subtopic_id == sub.id).order_by(Lesson.sort_order)
        )
    ).scalars().all()
    assert [l.slug for l in lessons] == [
        f"{sub.slug}--introduction",
        f"{sub.slug}--basic-problems",
    ]
    assert [l.sort_order for l in lessons] == [0, 1]


async def test_second_import_is_idempotent(db_session):
    t = await _topic(db_session)
    req = _req(t.slug, [_sub("A", ["x", "y"])])
    await import_topic(db_session, req, dry_run=False)
    res = await import_topic(db_session, req, dry_run=False)
    assert (res.created.subtopics, res.created.lessons) == (0, 0)
    assert (res.deleted.subtopics, res.deleted.lessons) == (0, 0)
    assert (res.updated.subtopics, res.updated.lessons) == (1, 2)


async def _add_file(db, lesson_slug: str):
    lesson = (await db.execute(select(Lesson).where(Lesson.slug == lesson_slug))).scalar_one()
    db.add(ContentFile(lesson_id=lesson.id, file_type=FileType.video, file_url="u", display_name="v"))
    await db.commit()


async def test_removed_lesson_is_deleted_with_its_content_files(db_session):
    t = await _topic(db_session)
    await import_topic(db_session, _req(t.slug, [_sub("A", ["x", "y"])]), dry_run=False)
    await _add_file(db_session, f"{t.slug}--a--y")
    res = await import_topic(db_session, _req(t.slug, [_sub("A", ["x"])]), dry_run=False)
    assert res.deleted.lessons == 1 and res.deleted.content_files == 1
    assert await _files_in(db_session, t.slug) == 0


async def test_kept_lesson_keeps_content_files(db_session):
    t = await _topic(db_session)
    req = _req(t.slug, [_sub("A", ["x"])])
    await import_topic(db_session, req, dry_run=False)
    await _add_file(db_session, f"{t.slug}--a--x")
    res = await import_topic(db_session, req, dry_run=False)
    assert res.deleted.content_files == 0
    assert await _files_in(db_session, t.slug) == 1


async def test_lesson_moved_between_subtopics_keeps_row(db_session):
    t = await _topic(db_session)
    t_slug = t.slug
    await import_topic(
        db_session,
        _req(t.slug, [_sub("A", ["x"], slug=f"{t.slug}--a"), _sub("B", [], slug=f"{t.slug}--b")]),
        dry_run=False,
    )
    lesson_slug = f"{t.slug}--a--x"
    lesson = (await db_session.execute(select(Lesson).where(Lesson.slug == lesson_slug))).scalar_one()
    lesson_id = lesson.id
    moved = {**_names("x"), "slug": lesson_slug}
    res = await import_topic(
        db_session,
        _req(t.slug, [
            _sub("A", [], slug=f"{t.slug}--a"),
            {**_sub("B", [], slug=f"{t.slug}--b"), "lessons": [moved]},
        ]),
        dry_run=False,
    )
    db_session.expire_all()
    same = (await db_session.execute(select(Lesson).where(Lesson.slug == lesson_slug))).scalar_one()
    parent = await db_session.get(Subtopic, same.subtopic_id)
    assert same.id == lesson_id and parent.slug == f"{t_slug}--b"
    assert res.deleted.lessons == 0 and res.created.lessons == 0


async def test_dry_run_leaves_db_unchanged_but_reports_counts(db_session):
    t = await _topic(db_session)
    before_sub = await _count(db_session, Subtopic)
    res = await import_topic(db_session, _req(t.slug, [_sub("A", ["x", "y"])]), dry_run=True)
    assert res.dry_run and not res.applied
    assert (res.created.subtopics, res.created.lessons) == (1, 2)
    db_session.expire_all()
    assert await _count(db_session, Subtopic) == before_sub


async def test_unknown_topic_raises_topic_not_found(db_session):
    with pytest.raises(TopicNotFound):
        await import_topic(db_session, _req("no-such-topic", []), dry_run=True)


async def test_duplicate_generated_slug_raises_validation_error(db_session):
    t = await _topic(db_session)
    with pytest.raises(ImportValidationError):
        await import_topic(db_session, _req(t.slug, [_sub("A", []), _sub("A", [])]), dry_run=True)


async def test_slug_owned_by_other_topic_raises_conflict(db_session):
    t1 = await _topic(db_session)
    t2 = await _topic(db_session)
    await import_topic(db_session, _req(t1.slug, [_sub("A", [], slug="shared-slug")]), dry_run=False)
    with pytest.raises(ImportConflict):
        await import_topic(db_session, _req(t2.slug, [_sub("A", [], slug="shared-slug")]), dry_run=True)
    await db_session.rollback()


def test_trigonometry_sample_file_is_valid():
    path = Path(__file__).resolve().parents[1] / "seeds" / "imports" / "trigonometry.json"
    req = TopicImportRequest.model_validate(json.loads(path.read_text(encoding="utf-8")))
    assert req.topic_slug == "trigonometry"
    assert len(req.subtopics) == 10
    assert sum(len(s.lessons) for s in req.subtopics) == 42
    assert all(len(s.icon) <= 20 for s in req.subtopics)


async def test_storage_removed_only_after_applied_import(db_session, monkeypatch):
    removed = []

    async def fake_remove(record):
        removed.append(record.display_name)

    monkeypatch.setattr("app.services.topic_import.remove_content_storage", fake_remove)
    t = await _topic(db_session)
    slug = t.slug
    await import_topic(db_session, _req(slug, [_sub("A", ["x", "y"])]), dry_run=False)
    await _add_file(db_session, f"{slug}--a--y")

    await import_topic(db_session, _req(slug, [_sub("A", ["x"])]), dry_run=True)
    assert removed == []

    await import_topic(db_session, _req(slug, [_sub("A", ["x"])]), dry_run=False)
    assert removed == ["v"]
