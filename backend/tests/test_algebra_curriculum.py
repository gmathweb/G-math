import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base
from app.models.lesson import Lesson
from app.models.subtopic import Subtopic
from app.models.topic import Topic
from seeds.algebra_curriculum import ALGEBRA, build_plan, load_algebra


def test_plan_is_complete_and_translated():
    plan = build_plan()
    assert len(plan) == 25
    assert sum(len(s["lessons"]) for s in plan) == 117
    for sub in plan:
        assert sub["icon"] and len(sub["icon"]) <= 20
        for item in [sub, *sub["lessons"]]:
            assert item["he"] and item["en"] and item["ar"]
            assert len(item["he"]) <= 200 and len(item["en"]) <= 200 and len(item["ar"]) <= 200


def test_slugs_are_unique():
    plan = build_plan()
    slugs = [s["slug"] for s in plan] + [l["slug"] for s in plan for l in s["lessons"]]
    assert len(slugs) == len(set(slugs))
    assert len(ALGEBRA) == 25


@pytest.mark.asyncio
async def test_load_is_idempotent(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'alg.db'}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with maker() as session:
        session.add(Topic(slug="algebra", icon="➕", color="#000", bg_color="#fff",
                          name_he="אלגברה", name_en="Algebra", name_ar="الجبر"))
        await session.commit()

        first = await load_algebra(session)
        second = await load_algebra(session)

        assert first == {"subtopics_created": 25, "subtopics_updated": 0,
                         "lessons_created": 117, "lessons_updated": 0}
        assert second == {"subtopics_created": 0, "subtopics_updated": 25,
                          "lessons_created": 0, "lessons_updated": 117}
        assert await session.scalar(select(func.count()).select_from(Subtopic)) == 25
        assert await session.scalar(select(func.count()).select_from(Lesson)) == 117
    await engine.dispose()
