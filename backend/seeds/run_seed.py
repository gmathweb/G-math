"""
Entry point for seeding the database.

Usage (from the backend/ directory):
    python -m seeds.run_seed
"""

from __future__ import annotations

import asyncio
import sys

from app.database import engine, async_session, Base

# Import all models so Base.metadata knows about every table
import app.models  # noqa: F401

from seeds.seed_data import (
    backfill_subtopic_icons,
    seed_all,
    seed_lesson_presentations,
    seed_site_content,
)


async def main() -> None:
    print("🔧  Creating tables (if they don't exist)…")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅  Tables ready.")

    print("🌱  Seeding database…")
    async with async_session() as session:
        counts = await seed_all(session)
        content_added = await seed_site_content(session)
        icons_filled = await backfill_subtopic_icons(session)
        presentations_added = await seed_lesson_presentations(session)

    if sum(counts.values()) == 0:
        print("ℹ️   Nothing to seed (data already present).")
    else:
        print(
            f"✅  Seeded: "
            f"{counts['topics']} topics, "
            f"{counts['subtopics']} subtopics, "
            f"{counts['lessons']} lessons, "
            f"{counts['hero_slides']} hero slides, "
            f"{counts['users']} users, "
            f"{counts['site_config']} site config entries."
        )
    print(
        f"✅  Home content keys added: {content_added}; "
        f"subtopic icons filled: {icons_filled}; "
        f"lesson presentations attached: {presentations_added}."
    )

    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(130)
