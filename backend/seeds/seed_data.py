"""
Seed the database with all prototype content from the G-math HTML prototype.

Populates: topics, subtopics, lessons, hero slides, site config and bundled
lesson presentations.
"""

from __future__ import annotations

import re
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import FileType
from app.models.topic import Topic
from app.models.subtopic import Subtopic
from app.models.lesson import Lesson
from app.models.hero import HeroSlide
from app.models.site_config import SiteConfig
from app.services.files import save_upload
from app.services.site_content import DEFAULT_SITE_CONTENT


SUBTOPIC_ICONS = ["=", "f(x)", "∑", "{}", "√", "log", "∪", "[ ]", "≤", "|x|"]

PRESENTATIONS_DIR = Path(__file__).parent / "presentations"

# HTML (iSpring "Web") exports shipped with the repo and attached to lessons by the seed.
LESSON_PRESENTATIONS: list[dict] = [
    {
        "lesson_slug": "algebra--quadratic-equations--factoring",
        "zip": "factoring-common-factor-2.zip",
        "display_name": "פירוק לגורמים – גורם משותף",
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slug(english_name: str, parent_slug: str = "") -> str:
    """Generate a URL-friendly slug from an English name."""
    s = english_name.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s]+", "-", s).strip("-")
    if parent_slug:
        return f"{parent_slug}--{s}"
    return s


# ---------------------------------------------------------------------------
# Topics / Subtopics / Lessons  (from the prototype D array)
# ---------------------------------------------------------------------------

# Each entry: (topic_id_tag, icon, color, bg_color, names, descriptions, is_about, subtopics)
# subtopics: list of (names, lessons)
# lessons:   list of {he, en, ar}

TOPICS_DATA: list[dict] = [
    {
        "tag": "about",
        "icon": "📐",
        "color": "#9C27B0",
        "bg_color": "#F3E5F5",
        "name": {"he": "על המתמטיקה", "en": "About Mathematics", "ar": "عن الرياضيات"},
        "desc": {"he": "מבוא כללי לעולם המתמטיקה", "en": "General introduction to mathematics", "ar": "مقدمة عامة للرياضيات"},
        "subs": [],  # about topic has no subtopics/lessons
    },
    {
        "tag": "alg",
        "icon": "➕",
        "color": "#6366f1",
        "bg_color": "#eef2ff",
        "name": {"he": "אלגברה", "en": "Algebra", "ar": "الجبر"},
        "desc": {"he": "משוואות, פונקציות וביטויים אלגבריים", "en": "Equations, functions and algebraic expressions", "ar": "معادلات ودوال وتعابير جبرية"},
        "subs": [
            {
                "name": {"he": "משוואות ליניאריות", "en": "Linear Equations", "ar": "معادلات خطية"},
                "lessons": [
                    {"he": "משוואה עם נעלם אחד", "en": "One Variable", "ar": "مجهول واحد"},
                    {"he": "מערכת שני נעלמים", "en": "Two Variables", "ar": "مجهولان"},
                    {"he": "בעיות מילוליות", "en": "Word Problems", "ar": "مسائل كلامية"},
                ],
            },
            {
                "name": {"he": "משוואות ריבועיות", "en": "Quadratic Equations", "ar": "معادلات تربيعية"},
                "lessons": [
                    {"he": "פירוק לגורמים", "en": "Factoring", "ar": "تحليل"},
                    {"he": "נוסחת השורשים", "en": "Quadratic Formula", "ar": "صيغة الجذور"},
                    {"he": "הדיסקרימיננטה", "en": "Discriminant", "ar": "المميز"},
                    {"he": "גרף הפרבולה", "en": "Parabola", "ar": "القطع المكافئ"},
                ],
            },
            {
                "name": {"he": "פונקציות", "en": "Functions", "ar": "الدوال"},
                "lessons": [
                    {"he": "מושג הפונקציה", "en": "Function Concept", "ar": "مفهوم الدالة"},
                    {"he": "פונקציה לינארית", "en": "Linear Function", "ar": "دالة خطية"},
                    {"he": "פונקציה ריבועית", "en": "Quadratic Function", "ar": "دالة تربيعية"},
                ],
            },
            {
                "name": {"he": "סדרות", "en": "Sequences", "ar": "متتاليات"},
                "lessons": [
                    {"he": "סדרה חשבונית", "en": "Arithmetic", "ar": "حسابية"},
                    {"he": "סדרה הנדסית", "en": "Geometric", "ar": "هندسية"},
                ],
            },
        ],
    },
    {
        "tag": "tri",
        "icon": "📊",
        "color": "#FF9800",
        "bg_color": "#FFF3E0",
        "name": {"he": "טריגונומטריה", "en": "Trigonometry", "ar": "علم المثلثات"},
        "desc": {"he": "פונקציות טריגונומטריות, זהויות ומשוואות", "en": "Trig functions, identities & equations", "ar": "دوال مثلثية وهويات"},
        "subs": [
            {
                "name": {"he": "יחסים טריגונומטריים", "en": "Trig Ratios", "ar": "نسب مثلثية"},
                "lessons": [
                    {"he": "סינוס, קוסינוס, טנגנס", "en": "Sin, Cos, Tan", "ar": "جيب، تمام، ظل"},
                    {"he": "מעגל היחידה", "en": "Unit Circle", "ar": "دائرة الوحدة"},
                ],
            },
            {
                "name": {"he": "זהויות", "en": "Identities", "ar": "هويات"},
                "lessons": [
                    {"he": "זהויות בסיסיות", "en": "Basic Identities", "ar": "هويات أساسية"},
                    {"he": "נוסחאות כפל", "en": "Double Angle", "ar": "صيغ الضعف"},
                ],
            },
            {
                "name": {"he": "משוואות", "en": "Equations", "ar": "معادلات"},
                "lessons": [
                    {"he": "פתרון משוואות", "en": "Solving", "ar": "حل"},
                    {"he": "יישומים", "en": "Applications", "ar": "تطبيقات"},
                ],
            },
        ],
    },
    {
        "tag": "cal",
        "icon": "∫",
        "color": "#4CAF50",
        "bg_color": "#E8F5E9",
        "name": {"he": "חדו״א", "en": "Calculus", "ar": "التفاضل والتكامل"},
        "desc": {"he": "חשבון דיפרנציאלי ואינטגרלי", "en": "Differential & integral calculus", "ar": "حساب التفاضل والتكامل"},
        "subs": [
            {
                "name": {"he": "גבולות", "en": "Limits", "ar": "نهايات"},
                "lessons": [
                    {"he": "מושג הגבול", "en": "Limit Concept", "ar": "مفهوم النهاية"},
                    {"he": "חוקי הגבולות", "en": "Limit Laws", "ar": "قوانين"},
                    {"he": "רציפות", "en": "Continuity", "ar": "استمرارية"},
                ],
            },
            {
                "name": {"he": "נגזרות", "en": "Derivatives", "ar": "مشتقات"},
                "lessons": [
                    {"he": "הגדרת הנגזרת", "en": "Definition", "ar": "تعريف"},
                    {"he": "כללי גזירה", "en": "Rules", "ar": "قواعد"},
                    {"he": "כלל השרשרת", "en": "Chain Rule", "ar": "قاعدة السلسلة"},
                    {"he": "יישומים", "en": "Applications", "ar": "تطبيقات"},
                ],
            },
            {
                "name": {"he": "אינטגרלים", "en": "Integrals", "ar": "تكاملات"},
                "lessons": [
                    {"he": "אינטגרל לא מסוים", "en": "Indefinite", "ar": "غير محدد"},
                    {"he": "אינטגרל מסוים", "en": "Definite", "ar": "محدد"},
                    {"he": "חישוב שטחים", "en": "Area Calc", "ar": "حساب مساحات"},
                ],
            },
        ],
    },
    {
        "tag": "spa",
        "icon": "🔲",
        "color": "#2196F3",
        "bg_color": "#E3F2FD",
        "name": {"he": "הנדסת המרחב", "en": "Spatial Eng.", "ar": "هندسة فراغية"},
        "desc": {"he": "גיאומטריה תלת-ממדית", "en": "3D geometry & solids", "ar": "أشكال ثلاثية الأبعاد"},
        "subs": [
            {
                "name": {"he": "גופים במרחב", "en": "Solids", "ar": "مجسمات"},
                "lessons": [
                    {"he": "תיבה", "en": "Prism", "ar": "منشور"},
                    {"he": "גליל", "en": "Cylinder", "ar": "أسطوانة"},
                    {"he": "חרוט", "en": "Cone", "ar": "مخروط"},
                    {"he": "כדור", "en": "Sphere", "ar": "كرة"},
                ],
            },
            {
                "name": {"he": "מישורים", "en": "Planes", "ar": "مستويات"},
                "lessons": [
                    {"he": "משוואת מישור", "en": "Plane Eq.", "ar": "معادلة مستوى"},
                    {"he": "מרחק נקודה", "en": "Point Distance", "ar": "مسافة نقطة"},
                ],
            },
        ],
    },
    {
        "tag": "ana",
        "icon": "📈",
        "color": "#00BCD4",
        "bg_color": "#E0F7FA",
        "name": {"he": "אנליטית", "en": "Analytic", "ar": "تحليلية"},
        "desc": {"he": "גיאומטריה אנליטית במישור", "en": "Analytic geometry", "ar": "هندسة تحليلية"},
        "subs": [
            {
                "name": {"he": "ישר במישור", "en": "Lines", "ar": "مستقيمات"},
                "lessons": [
                    {"he": "משוואת ישר", "en": "Line Eq.", "ar": "معادلة مستقيم"},
                    {"he": "שיפוע", "en": "Slope", "ar": "ميل"},
                    {"he": "מרחק נקודה מישר", "en": "Point-Line Dist.", "ar": "مسافة"},
                ],
            },
            {
                "name": {"he": "מעגל", "en": "Circles", "ar": "دوائر"},
                "lessons": [
                    {"he": "משוואת מעגל", "en": "Circle Eq.", "ar": "معادلة دائرة"},
                    {"he": "ישר ומעגל", "en": "Line & Circle", "ar": "مستقيم ودائرة"},
                ],
            },
        ],
    },
    {
        "tag": "vec",
        "icon": "➡️",
        "color": "#795548",
        "bg_color": "#EFEBE9",
        "name": {"he": "וקטורים", "en": "Vectors", "ar": "متجهات"},
        "desc": {"he": "חשבון וקטורי", "en": "Vector arithmetic", "ar": "حساب متجهات"},
        "subs": [
            {
                "name": {"he": "פעולות", "en": "Operations", "ar": "عمليات"},
                "lessons": [
                    {"he": "חיבור וחיסור", "en": "Add & Sub", "ar": "جمع وطرح"},
                    {"he": "כפל בסקלר", "en": "Scalar Mult.", "ar": "ضرب بعدد"},
                    {"he": "מכפלה סקלרית", "en": "Dot Product", "ar": "جداء نقطي"},
                ],
            },
            {
                "name": {"he": "יישומים", "en": "Applications", "ar": "تطبيقات"},
                "lessons": [
                    {"he": "בגיאומטריה", "en": "In Geometry", "ar": "في الهندسة"},
                    {"he": "בפיזיקה", "en": "In Physics", "ar": "في الفيزياء"},
                ],
            },
        ],
    },
    {
        "tag": "geo",
        "icon": "△",
        "color": "#607D8B",
        "bg_color": "#ECEFF1",
        "name": {"he": "גיאומטריה", "en": "Geometry", "ar": "هندسة"},
        "desc": {"he": "משפטים והוכחות", "en": "Theorems & proofs", "ar": "مبرهنات وبراهين"},
        "subs": [
            {
                "name": {"he": "משולשים", "en": "Triangles", "ar": "مثلثات"},
                "lessons": [
                    {"he": "סוגי משולשים", "en": "Types", "ar": "أنواع"},
                    {"he": "חפיפה", "en": "Congruence", "ar": "تطابق"},
                    {"he": "דמיון", "en": "Similarity", "ar": "تشابه"},
                ],
            },
            {
                "name": {"he": "מרובעים", "en": "Quadrilaterals", "ar": "رباعيات"},
                "lessons": [
                    {"he": "מקבילית", "en": "Parallelogram", "ar": "متوازي أضلاع"},
                    {"he": "מעוין", "en": "Rhombus", "ar": "معين"},
                    {"he": "טרפז", "en": "Trapezoid", "ar": "شبه منحرف"},
                ],
            },
            {
                "name": {"he": "מעגל", "en": "Circles", "ar": "دوائر"},
                "lessons": [
                    {"he": "זוויות", "en": "Angles", "ar": "زوايا"},
                    {"he": "משיקים ומיתרים", "en": "Tangents", "ar": "مماسات"},
                ],
            },
        ],
    },
    {
        "tag": "prb",
        "icon": "🎲",
        "color": "#E91E63",
        "bg_color": "#FCE4EC",
        "name": {"he": "הסתברות", "en": "Probability", "ar": "احتمالات"},
        "desc": {"he": "הסתברות, קומבינטוריקה וסטטיסטיקה", "en": "Probability & combinatorics", "ar": "احتمالات وتوافقيات"},
        "subs": [
            {
                "name": {"he": "הסתברות בסיסית", "en": "Basic Prob.", "ar": "أساسيات"},
                "lessons": [
                    {"he": "מרחב מדגם", "en": "Sample Space", "ar": "فضاء عينة"},
                    {"he": "הסתברות מאורע", "en": "Event Prob.", "ar": "احتمال حدث"},
                    {"he": "עץ הסתברות", "en": "Prob. Tree", "ar": "شجرة"},
                ],
            },
            {
                "name": {"he": "קומבינטוריקה", "en": "Combinatorics", "ar": "توافقيات"},
                "lessons": [
                    {"he": "תמורות", "en": "Permutations", "ar": "تباديل"},
                    {"he": "צירופים", "en": "Combinations", "ar": "توافيق"},
                    {"he": "בינום ניוטון", "en": "Binomial", "ar": "ذات الحدين"},
                ],
            },
        ],
    },
]


# ---------------------------------------------------------------------------
# Hero slides  (from the prototype heroSlides array)
# ---------------------------------------------------------------------------

HERO_SLIDES_DATA: list[dict] = [
    {
        "title": {
            "he": "כל השיעורים והמצגות ללימודי מתמטיקה בתיכון, במקום אחד.",
            "en": "All lessons and presentations for high school math, in one place.",
            "ar": "جميع الدروس والعروض لتعليم الرياضيات في المدرسة الثانوية، في مكان واحد.",
        },
        "subtitle": {
            "he": "מתמטיקה לכל.",
            "en": "Math for Everyone.",
            "ar": "رياضيات للجميع.",
        },
        "button_text": {
            "he": "התחילו ללמוד",
            "en": "Start Learning",
            "ar": "ابدأ التعلم",
        },
        "button_link": "/#topics",
    },
    {
        "title": {
            "he": "G-math הוקמה כדי להעניק לכל תלמידי ישראל הזדמנות שווה לצמיחה.",
            "en": "G-math was founded to give every student an equal opportunity to grow.",
            "ar": "تأسست G-math لمنح كل طالب فرصة متساوية للنمو.",
        },
        "subtitle": {
            "he": "הפרויקט נוסד מתוך חזונה של שרה גרז׳וטיס, מורה ותיקה למתמטיקה – להנגיש את עולמות המספרים והצורות לכל תלמיד ותלמידה.",
            "en": "The project was founded on the vision of Sarah Grazhutis, a veteran math teacher.",
            "ar": "تأسس المشروع من رؤية سارة غرازوتيس، معلمة رياضيات مخضرمة.",
        },
        "button_text": {
            "he": "עוד קצת עלינו",
            "en": "More About Us",
            "ar": "المزيد عنا",
        },
        "button_link": "/#about",
    },
    {
        "title": {
            "he": "המתמטיקה היא מתנה המפתחת חשיבה לוגית ויצירתית לפתרון בעיות.",
            "en": "Mathematics is a gift that develops logical and creative thinking.",
            "ar": "الرياضيات هبة تطور التفكير المنطقي والإبداعي.",
        },
        "subtitle": {"he": "", "en": "", "ar": ""},
        "button_text": {"he": "", "en": "", "ar": ""},
        "button_link": "",
    },
]


# ---------------------------------------------------------------------------
# Site config
# ---------------------------------------------------------------------------

SITE_CONFIG_DATA: dict[str, str] = {
    "site_name": "G-math",
    "default_language": "he",
    "primary_color": "#6366f1",
}


# ---------------------------------------------------------------------------
# Seed runner
# ---------------------------------------------------------------------------

async def seed_all(session: AsyncSession) -> dict[str, int]:
    """Populate the database. Returns counts of created entities.

    Safely skips if data already exists (checks for any Topic row).
    """
    existing = await session.execute(select(Topic).limit(1))
    if existing.scalar_one_or_none() is not None:
        print("⏭  Database already seeded — skipping.")
        return {"topics": 0, "subtopics": 0, "lessons": 0, "hero_slides": 0, "users": 0, "site_config": 0}

    counts: dict[str, int] = {
        "topics": 0,
        "subtopics": 0,
        "lessons": 0,
        "hero_slides": 0,
        "users": 0,
        "site_config": 0,
    }

    # -- Topics / Subtopics / Lessons --
    for t_idx, td in enumerate(TOPICS_DATA):
        topic_slug = _slug(td["name"]["en"])
        topic = Topic(
            id=uuid.uuid4(),
            slug=topic_slug,
            icon=td["icon"],
            color=td["color"],
            bg_color=td["bg_color"],
            name_he=td["name"]["he"],
            name_en=td["name"]["en"],
            name_ar=td["name"]["ar"],
            description_he=td["desc"]["he"],
            description_en=td["desc"]["en"],
            description_ar=td["desc"]["ar"],
            sort_order=t_idx,
            is_published=True,
        )
        session.add(topic)
        counts["topics"] += 1

        for s_idx, sd in enumerate(td.get("subs", [])):
            sub_slug = _slug(sd["name"]["en"], topic_slug)
            subtopic = Subtopic(
                id=uuid.uuid4(),
                topic_id=topic.id,
                slug=sub_slug,
                name_he=sd["name"]["he"],
                name_en=sd["name"]["en"],
                name_ar=sd["name"]["ar"],
                icon=SUBTOPIC_ICONS[s_idx % len(SUBTOPIC_ICONS)],
                sort_order=s_idx,
                is_published=True,
            )
            session.add(subtopic)
            counts["subtopics"] += 1

            for l_idx, ld in enumerate(sd.get("lessons", [])):
                lesson_slug = _slug(ld["en"], sub_slug)
                lesson = Lesson(
                    id=uuid.uuid4(),
                    subtopic_id=subtopic.id,
                    slug=lesson_slug,
                    name_he=ld["he"],
                    name_en=ld["en"],
                    name_ar=ld["ar"],
                    sort_order=l_idx,
                    is_published=True,
                )
                session.add(lesson)
                counts["lessons"] += 1

    # -- Hero slides --
    for h_idx, hd in enumerate(HERO_SLIDES_DATA):
        slide = HeroSlide(
            id=uuid.uuid4(),
            title_he=hd["title"]["he"],
            title_en=hd["title"]["en"],
            title_ar=hd["title"]["ar"],
            subtitle_he=hd["subtitle"]["he"],
            subtitle_en=hd["subtitle"]["en"],
            subtitle_ar=hd["subtitle"]["ar"],
            button_text_he=hd["button_text"]["he"],
            button_text_en=hd["button_text"]["en"],
            button_text_ar=hd["button_text"]["ar"],
            button_link=hd["button_link"],
            sort_order=h_idx,
            is_active=True,
        )
        session.add(slide)
        counts["hero_slides"] += 1

    # -- Site config --
    for key, value in SITE_CONFIG_DATA.items():
        session.add(SiteConfig(key=key, value=value))
        counts["site_config"] += 1

    await session.commit()
    return counts


async def seed_site_content(session: AsyncSession) -> int:
    """Insert missing home-page content keys. Existing values are never touched."""
    existing = set((await session.execute(select(SiteConfig.key))).scalars().all())
    added = 0
    for key, value in DEFAULT_SITE_CONTENT.items():
        if key not in existing:
            session.add(SiteConfig(key=key, value=value))
            added += 1
    await session.commit()
    return added


async def backfill_subtopic_icons(session: AsyncSession) -> int:
    """Give subtopics with an empty icon the mockup glyph for their position."""
    result = await session.execute(
        select(Subtopic).order_by(Subtopic.topic_id, Subtopic.sort_order, Subtopic.slug)
    )
    positions: dict = {}
    filled = 0
    for subtopic in result.scalars().all():
        index = positions.get(subtopic.topic_id, 0)
        positions[subtopic.topic_id] = index + 1
        if not subtopic.icon:
            subtopic.icon = SUBTOPIC_ICONS[index % len(SUBTOPIC_ICONS)]
            filled += 1
    await session.commit()
    return filled


async def seed_lesson_presentations(session: AsyncSession) -> int:
    """Attach each bundled presentation to its lesson once.

    A ``seed.presentation.<zip>`` site-config marker records the attachment, so re-running the
    seed never duplicates it or brings back a presentation the admin renamed or deleted.
    Presentations whose lesson does not exist (e.g. renamed slug) are skipped.
    """
    attached = 0
    for item in LESSON_PRESENTATIONS:
        marker = f"seed.presentation.{item['zip']}"
        if await session.get(SiteConfig, marker) is not None:
            continue
        lesson = await session.scalar(select(Lesson).where(Lesson.slug == item["lesson_slug"]))
        if lesson is None:
            continue
        with (PRESENTATIONS_DIR / item["zip"]).open("rb") as bundle:
            record = await save_upload(
                session,
                UploadFile(file=bundle, filename=item["zip"]),
                lesson.id,
                FileType.presentation,
                item["display_name"],
            )
        session.add(SiteConfig(key=marker, value=str(record.id)))
        await session.commit()
        attached += 1
    return attached
