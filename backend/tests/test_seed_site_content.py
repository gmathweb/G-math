"""Seeding must only add missing data and never overwrite admin edits."""

import uuid

from sqlalchemy import delete, select

from app.models.site_config import SiteConfig
from app.models.subtopic import Subtopic
from app.models.topic import Topic
from app.services.site_content import DEFAULT_SITE_CONTENT
from seeds.seed_data import SUBTOPIC_ICONS, backfill_subtopic_icons, seed_site_content


async def test_seed_site_content_inserts_missing_and_keeps_existing(db_session):
    await db_session.execute(delete(SiteConfig).where(SiteConfig.key.like("home.%")))
    db_session.add(SiteConfig(key="home.trust.1.text_he", value="ערך של מנהל"))
    await db_session.commit()

    added = await seed_site_content(db_session)

    assert added == len(DEFAULT_SITE_CONTENT) - 1
    rows = dict((await db_session.execute(select(SiteConfig.key, SiteConfig.value))).all())
    assert rows["home.trust.1.text_he"] == "ערך של מנהל"
    assert rows["home.about.button_link"] == "/about-mathematics"
    assert await seed_site_content(db_session) == 0


def _names(prefix: str) -> dict[str, str]:
    tag = f"{prefix}-{uuid.uuid4().hex[:6]}"
    return {"name_he": tag, "name_en": tag, "name_ar": tag}


async def test_backfill_subtopic_icons_only_fills_empty(db_session):
    topic = Topic(
        slug=f"seed-topic-{uuid.uuid4().hex[:8]}", icon="📐", color="#000000",
        bg_color="#ffffff", sort_order=0, is_published=True, **_names("t"),
    )
    db_session.add(topic)
    await db_session.flush()
    kept = Subtopic(topic_id=topic.id, slug=f"kept-{uuid.uuid4().hex[:8]}", icon="★",
                    sort_order=0, is_published=True, **_names("s"))
    empty = Subtopic(topic_id=topic.id, slug=f"empty-{uuid.uuid4().hex[:8]}", icon="",
                     sort_order=1, is_published=True, **_names("s"))
    db_session.add_all([kept, empty])
    await db_session.commit()

    await backfill_subtopic_icons(db_session)
    await db_session.refresh(kept)
    await db_session.refresh(empty)

    assert kept.icon == "★"
    assert empty.icon == SUBTOPIC_ICONS[1]
