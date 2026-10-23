from __future__ import annotations

import uuid
from collections import Counter

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import ContentFile
from app.models.lesson import Lesson
from app.models.subtopic import Subtopic
from app.models.topic import Topic
from app.schemas.topic_import import (
    DeletedCounts,
    ImportCounts,
    TopicImportRequest,
    TopicImportResult,
)
from app.utils import slugify

SLUG_MAX = 100


class TopicNotFound(Exception):
    pass


class ImportValidationError(Exception):
    pass


class ImportConflict(Exception):
    pass


def _generated(prefix: str, name_en: str) -> str:
    # Truncated to the column width so long English names never break the insert.
    return f"{prefix}--{slugify(name_en)}"[:SLUG_MAX].rstrip("-")


def _plan_slugs(req: TopicImportRequest) -> tuple[list[str], list[list[str]]]:
    sub_slugs: list[str] = []
    lesson_slugs: list[list[str]] = []
    for sub in req.subtopics:
        sub_slug = sub.slug or _generated(req.topic_slug, sub.name_en)
        sub_slugs.append(sub_slug)
        lesson_slugs.append([l.slug or _generated(sub_slug, l.name_en) for l in sub.lessons])

    dup_subs = [s for s, n in Counter(sub_slugs).items() if n > 1]
    dup_lessons = [s for s, n in Counter(x for g in lesson_slugs for x in g).items() if n > 1]
    if dup_subs or dup_lessons:
        raise ImportValidationError(
            "Duplicate slugs in file: " + ", ".join(dup_subs + dup_lessons)
            + ". Give the items explicit unique slugs."
        )
    return sub_slugs, lesson_slugs


async def import_topic(
    db: AsyncSession, req: TopicImportRequest, *, dry_run: bool
) -> TopicImportResult:
    try:
        result = await _run(db, req, dry_run)
    except Exception:
        await db.rollback()
        raise
    if dry_run:
        await db.rollback()
    else:
        await db.commit()
    return result


async def _run(db: AsyncSession, req: TopicImportRequest, dry_run: bool) -> TopicImportResult:
    topic = (
        await db.execute(select(Topic).where(Topic.slug == req.topic_slug))
    ).scalar_one_or_none()
    if topic is None:
        raise TopicNotFound(f"Topic '{req.topic_slug}' not found")

    sub_slugs, lesson_slugs = _plan_slugs(req)
    all_lesson_slugs = {x for g in lesson_slugs for x in g}

    taken_sub = (
        await db.execute(
            select(Subtopic.slug).where(Subtopic.slug.in_(sub_slugs), Subtopic.topic_id != topic.id)
        )
    ).scalars().all()
    taken_lesson = (
        await db.execute(
            select(Lesson.slug)
            .join(Subtopic, Lesson.subtopic_id == Subtopic.id)
            .where(Lesson.slug.in_(all_lesson_slugs), Subtopic.topic_id != topic.id)
        )
    ).scalars().all()
    if taken_sub or taken_lesson:
        raise ImportConflict(
            "Slugs already used by another topic: " + ", ".join(list(taken_sub) + list(taken_lesson))
        )

    existing_subs = {
        s.slug: s
        for s in (await db.execute(select(Subtopic).where(Subtopic.topic_id == topic.id))).scalars()
    }
    existing_lessons = {
        l.slug: l
        for l in (
            await db.execute(
                select(Lesson)
                .join(Subtopic, Lesson.subtopic_id == Subtopic.id)
                .where(Subtopic.topic_id == topic.id)
            )
        ).scalars()
    }

    created = ImportCounts()
    updated = ImportCounts()
    deleted = DeletedCounts()

    # Delete lessons (and their files) that are absent from the file. Explicit deletes,
    # because SQLite test DBs do not enforce FK cascades.
    gone_lesson_ids = [l.id for s, l in existing_lessons.items() if s not in all_lesson_slugs]
    if gone_lesson_ids:
        deleted.content_files = (
            await db.execute(
                select(func.count()).select_from(ContentFile).where(
                    ContentFile.lesson_id.in_(gone_lesson_ids)
                )
            )
        ).scalar_one()
        await db.execute(delete(ContentFile).where(ContentFile.lesson_id.in_(gone_lesson_ids)))
        await db.execute(delete(Lesson).where(Lesson.id.in_(gone_lesson_ids)))
        deleted.lessons = len(gone_lesson_ids)

    sub_ids: dict[str, uuid.UUID] = {}
    for idx, (sub, slug) in enumerate(zip(req.subtopics, sub_slugs)):
        row = existing_subs.get(slug)
        if row is None:
            row = Subtopic(topic_id=topic.id, slug=slug, is_published=True)
            db.add(row)
            created.subtopics += 1
        else:
            updated.subtopics += 1
        row.name_he, row.name_en, row.name_ar = sub.name_he, sub.name_en, sub.name_ar
        row.icon = sub.icon
        row.sort_order = idx
    await db.flush()
    for slug in sub_slugs:
        sub_ids[slug] = (
            await db.execute(select(Subtopic.id).where(Subtopic.slug == slug))
        ).scalar_one()

    for sub, sub_slug, slugs in zip(req.subtopics, sub_slugs, lesson_slugs):
        for idx, (lesson, slug) in enumerate(zip(sub.lessons, slugs)):
            row = existing_lessons.get(slug)
            if row is None:
                row = Lesson(slug=slug, is_published=True)
                db.add(row)
                created.lessons += 1
            else:
                updated.lessons += 1
            row.subtopic_id = sub_ids[sub_slug]
            row.name_he, row.name_en, row.name_ar = lesson.name_he, lesson.name_en, lesson.name_ar
            row.sort_order = idx
    await db.flush()

    # Remaining lessons were re-parented above, so these subtopics are now empty.
    gone_subs = [s.id for slug, s in existing_subs.items() if slug not in sub_slugs]
    if gone_subs:
        await db.execute(delete(Subtopic).where(Subtopic.id.in_(gone_subs)))
        deleted.subtopics = len(gone_subs)
    await db.flush()

    return TopicImportResult(
        dry_run=dry_run,
        applied=not dry_run,
        topic_slug=req.topic_slug,
        created=created,
        updated=updated,
        deleted=deleted,
    )
