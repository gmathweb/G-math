"""
Load the Algebra curriculum (25 subtopics, 117 lessons) into the `algebra` topic.

Idempotent: rows are matched by slug and updated in place, missing rows are created.
Nothing is deleted. Slugs follow seeds.seed_data._slug (parent--english-name).

Usage (from the backend/ directory, DATABASE_URL pointing at the target database):
    python -m seeds.algebra_curriculum
"""

from __future__ import annotations

import asyncio
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

TOPIC_SLUG = "algebra"

Name = tuple[str, str, str]  # (he, en, ar)

U4 = U5 = 'יח"ל'  # "units" suffix used in Bagrut level names


def _slug(english_name: str, parent_slug: str = "") -> str:
    """Same slug scheme as seeds.seed_data._slug (kept local to avoid its heavy imports)."""
    s = english_name.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s]+", "-", s).strip("-")
    return f"{parent_slug}--{s}" if parent_slug else s

ALGEBRA: list[tuple[str, Name, list[Name]]] = [
    ("🔢", ("בסיס", "Basics", "الأساسيات"), [
        ("שברים - חזרה", "Fractions – Review", "الكسور – مراجعة"),
        ("שורש ריבועי", "Square Root", "الجذر التربيعي"),
        ("דברים שצריך לדעת על פה", "Things to Know by Heart", "أمور يجب حفظها عن ظهر قلب"),
        ("ערך מוחלט", "Absolute Value", "القيمة المطلقة"),
    ]),
    ("x+y", ("פעולות חשבון בביטויים אלגבריים", "Arithmetic with Algebraic Expressions", "العمليات الحسابية على التعابير الجبرية"), [
        ("מבוא", "Introduction", "مقدمة"),
        ("חיבור (שבר)", "Addition (Fractions)", "جمع (الكسور)"),
        ("חיסור (שבר)", "Subtraction (Fractions)", "طرح (الكسور)"),
        ("כפל", "Multiplication", "ضرب"),
        ("חילוק", "Division", "قسمة"),
    ]),
    ("( )( )", ("פירוק לגורמים", "Factoring", "التحليل إلى عوامل"), [
        ("מבוא", "Introduction", "مقدمة"),
        ("גורם משותף", "Common Factor", "العامل المشترك"),
        ("חלוקה לקבוצות", "Grouping", "التجميع في مجموعات"),
        ("כפל מקוצר - הוכחות", "Special Products – Proofs", "الضرب المختصر – البراهين"),
        ("כפל מקוצר", "Special Products", "الضرب المختصر"),
        ("טרינום", "Trinomial", "ثلاثي الحدود"),
    ]),
    ("=", ("פתירת משוואות", "Solving Equations", "حل المعادلات"), [
        ("מבוא", "Introduction", "مقدمة"),
    ]),
    ("ax+b", ("משוואות ממעלה ראשונה", "Linear Equations", "معادلات من الدرجة الأولى"), [
        ("הצבה", "Substitution", "التعويض"),
        ("השוואת מקדמים", "Equating Coefficients", "مساواة المعاملات"),
    ]),
    ("x²", ("משוואות ממעלה שנייה", "Quadratic Equations", "معادلات من الدرجة الثانية"), [
        ("מבוא", "Introduction", "مقدمة"),
        ("פתרונות", "Solutions", "الحلول"),
        ("מספר הפתרונות", "Number of Solutions", "عدد الحلول"),
    ]),
    ("√", ("משוואות אי רציונליות", "Irrational Equations", "معادلات لا نسبية (جذرية)"), [
        ("תרגילים", "Exercises", "تمارين"),
    ]),
    ("x,a", ("משוואות פרמטריות מעלה ראשונה", "Parametric Linear Equations", "معادلات بارامترية من الدرجة الأولى"), [
        ("קביעת נושא", "Choosing the Subject", "تحديد موضوع القانون"),
        ("נעלם אחד", "One Unknown", "مجهول واحد"),
        ("שני נעלמים", "Two Unknowns", "مجهولان"),
    ]),
    ("📝", ("בעיות-משוואה ממעלה ראשונה", "Linear Equation Word Problems", "مسائل كلامية على معادلات من الدرجة الأولى"), [
        ("נעלם אחד", "One Unknown", "مجهول واحد"),
        ("בעיות גיל", "Age Problems", "مسائل الأعمار"),
    ]),
    ("🚗", ("בעיות תנועה", "Motion Problems", "مسائل الحركة"), [
        ("הכרות", "Overview", "نظرة عامة"),
        ("שונות", "Miscellaneous", "متنوعة"),
        (f"מבגרות 4 {U4}", "From Bagrut – 4 Units", "من البجروت – 4 وحدات"),
        (f"מבגרות 5 {U5}", "From Bagrut – 5 Units", "من البجروت – 5 وحدات"),
    ]),
    ("%", ("אחוזים-תערובת", "Percentages & Mixtures", "النسب المئوية والمخاليط"), [
        ("הכרות", "Overview", "نظرة عامة"),
        ("נוסחת קסם", "Magic Formula", "الصيغة السحرية"),
        ("תמורת האחוז", "Value of a Percent", "قيمة النسبة المئوية"),
        ("גודל יסודי", "Base Quantity", "الكمية الأساسية"),
        ("אחוז", "Percent", "نسبة مئوية"),
        ("סיכום", "Summary", "ملخص"),
        (f"אחוז - 4 {U4}", "Percent – 4 Units", "نسبة مئوية – 4 وحدات"),
    ]),
    ("⏱️", ("בעיות הספק", "Work-Rate Problems", "مسائل القدرة"), [
        ("הכרות", "Overview", "نظرة عامة"),
        ("מילוי / ריקון", "Filling / Emptying", "ملء / تفريغ"),
        (f"מילוי - 4 {U4}", "Filling – 4 Units", "ملء – 4 وحدات"),
        (f"מילוי - 5 {U5}", "Filling – 5 Units", "ملء – 5 وحدات"),
        ("דרכים - הספק", "Methods – Rate", "طرق – القدرة"),
        (f"שאלת 5 {U5}", "5-Unit Question", "سؤال 5 وحدات"),
    ]),
    ("P(x)", ("פולינומים", "Polynomials", "كثيرات الحدود"), [
        ("חלוקה", "Division", "القسمة"),
    ]),
    ("≤", ("אי שוויונים", "Inequalities", "المتباينات"), [
        ("הכרות", "Overview", "نظرة عامة"),
        ("מעלה ראשונה", "First Degree", "الدرجة الأولى"),
        ("מעלה שנייה", "Second Degree", "الدرجة الثانية"),
        ("מעלה שנייה (המשך)", "Second Degree – Part 2", "الدرجة الثانية – الجزء 2"),
        ("מעלה גדולה מ-2", "Higher than Second Degree", "درجة أعلى من الثانية"),
        ("ערך מוחלט", "Absolute Value", "القيمة المطلقة"),
    ]),
    ("∪", ("חקירת פונקציה ריבועית", "Quadratic Function Investigation", "دراسة الدالة التربيعية"), [
        ("מבוא", "Introduction", "مقدمة"),
        ("חקירה", "Investigation", "دراسة"),
        ("משאלוני בגרות", "Bagrut Questionnaires", "نماذج بجروت"),
    ]),
    ("x₁x₂", ("שורשי משוואה ריבועית", "Roots of a Quadratic Equation", "جذور المعادلة التربيعية"), [
        ("חוקי ויאטה", "Vieta's Formulas", "قوانين فييت"),
        ("פתרונות וסימנם", "Solutions and Their Signs", "الحلول وإشاراتها"),
    ]),
    ("n+1", ("אינדוקציה", "Induction", "الاستقراء الرياضي"), [
        ("נוסחאות סכום", "Sum Formulas", "صيغ المجموع"),
        ("איבר משתנה", "Variable Term", "الحد المتغير"),
        ("הוכחת חילוק", "Divisibility Proofs", "إثبات قابلية القسمة"),
        ("זוגי–אי זוגי", "Even–Odd", "زوجي–فردي"),
        ("אי שוויונים", "Inequalities", "المتباينات"),
        ("איבר משתנה (המשך)", "Variable Term – Part 2", "الحد المتغير – الجزء 2"),
        ("חוק נסיגה", "Recurrence Law", "قانون التراجع"),
    ]),
    ("aˣ", ("משוואות/אי שוויונים מעריכיים", "Exponential Equations & Inequalities", "معادلات/متباينات أسّية"), [
        ("כללי חזקות", "Laws of Exponents", "قوانين الأسس"),
        ("כללי חזקות (המשך)", "Laws of Exponents – Part 2", "قوانين الأسس – الجزء 2"),
        ("סיכום כללים", "Summary of Rules", "ملخص القوانين"),
        ("משוואות", "Equations", "معادلات"),
        ("משוואות (המשך)", "Equations – Part 2", "معادلات – الجزء 2"),
        ("אי שוויונים", "Inequalities", "متباينات"),
        (f"משאלוני 4 {U4}", "4-Unit Questionnaires", "نماذج 4 وحدات"),
        (f"משאלוני 5 {U5}", "5-Unit Questionnaires", "نماذج 5 وحدات"),
    ]),
    ("log", ("לוגריתמים", "Logarithms", "اللوغاريتمات"), [
        ("הכרות", "Overview", "نظرة عامة"),
        ("חוקי הלוגריתמים", "Laws of Logarithms", "قوانين اللوغاريتمات"),
        ("החוקים טועים?", "Are the Laws Wrong?", "هل القوانين خاطئة؟"),
        ("ביטויים", "Expressions", "تعابير"),
        ("משוואות", "Equations", "معادلات"),
        ("מעבר בסיס", "Change of Base", "تغيير الأساس"),
        ("משוואות (המשך)", "Equations – Part 2", "معادلات – الجزء 2"),
        (f"משאלוני 4 {U4}", "4-Unit Questionnaires", "نماذج 4 وحدات"),
        (f"משאלוני 5 {U5}", "5-Unit Questionnaires", "نماذج 5 وحدات"),
        ("אי שוויונים", "Inequalities", "متباينات"),
        ("חידות", "Riddles", "ألغاز"),
        ("אי שוויונים (המשך)", "Inequalities – Part 2", "متباينات – الجزء 2"),
        (f"5 {U5}", "5 Units", "5 وحدات"),
    ]),
    ("∑", ("סדרות", "Sequences", "المتتاليات"), [
        ("מבוא", "Introduction", "مقدمة"),
        ("סכום איברים", "Sum of Terms", "مجموع الحدود"),
    ]),
    ("+d", ("סדרה חשבונית", "Arithmetic Sequence", "المتتالية الحسابية"), [
        ("הכרות", "Overview", "نظرة عامة"),
        ("איבר כללי - הכרות", "General Term – Overview", "الحد العام – نظرة عامة"),
        ("מספרים-מבוא", "Numbers – Introduction", "أعداد – مقدمة"),
        ("מספרים", "Numbers", "أعداد"),
        ("שאלות", "Questions", "أسئلة"),
        ("איברים במקום זוגי/אי זוגי", "Terms in Even/Odd Positions", "حدود في مكان زوجي/فردي"),
        ("הוכחות", "Proofs", "براهين"),
        ("סכום איברים", "Sum of Terms", "مجموع الحدود"),
        ("מקום זוגי/אי זוגי", "Even/Odd Position", "مكان زوجي/فردي"),
    ]),
    ("×q", ("סדרה הנדסית", "Geometric Sequence", "المتتالية الهندسية"), [
        ("הכרות", "Overview", "نظرة عامة"),
        ("האיבר הכללי", "The General Term", "الحد العام"),
        ("סכום", "Sum", "المجموع"),
    ]),
    ("aₙ₊₁", ("חוק נסיגה", "Recurrence Relation", "قانون التراجع"), [
        ("הכרות", "Overview", "نظرة عامة"),
        ("בעיות ראשונות", "First Problems", "مسائل أولى"),
        (f"משאלוני 5 {U5}", "5-Unit Questionnaires", "نماذج 5 وحدات"),
    ]),
    ("📈", ("גידול ודעיכה", "Growth and Decay", "النمو والاضمحلال"), [
        ("הכרות", "Overview", "نظرة عامة"),
        ("M0 - מציאת סדרה הנדסית אינסופית", "Finding M0 – Infinite Geometric Series", "إيجاد M0 – متتالية هندسية لانهائية"),
        ("מבוא", "Introduction", "مقدمة"),
        ("שברים מחזוריים", "Repeating Decimals", "الكسور الدورية"),
        ("תרגילים", "Exercises", "تمارين"),
        ("ההפרשים יוצרים סדרה", "The Differences Form a Sequence", "الفروق تشكّل متتالية"),
        ("חשבונית/הנדסית", "Arithmetic/Geometric", "حسابية/هندسية"),
    ]),
    ("a+bi", ("מספרים מרוכבים", "Complex Numbers", "الأعداد المركبة"), [
        ("הכרות", "Overview", "نظرة عامة"),
        ("פעולות חשבוניות", "Arithmetic Operations", "العمليات الحسابية"),
        ("המישור של גאוס", "The Gaussian Plane", "مستوى غاوس (المستوى العقدي)"),
        ("גאוס - 4 פעולות", "Gauss – 4 Operations", "غاوس – العمليات الأربع"),
        ("משפט דה מואבר", "De Moivre's Theorem", "نظرية دي موافر"),
        ("שאלות בגרות", "Bagrut Questions", "أسئلة بجروت"),
        ("מעריך שברי", "Fractional Exponent", "أس كسري"),
        ("שורשי היחידה", "Roots of Unity", "جذور الوحدة"),
        ("תרגול", "Practice", "تدريب"),
    ]),
]


def build_plan() -> list[dict]:
    """Flatten ALGEBRA into subtopic/lesson dicts with slugs; fail on duplicate or over-long slugs."""
    plan: list[dict] = []
    seen: set[str] = set()

    def claim(slug: str) -> str:
        if len(slug) > 100 or slug in seen:
            raise ValueError(f"Bad or duplicate slug: {slug}")
        seen.add(slug)
        return slug

    for s_idx, (icon, (he, en, ar), lessons) in enumerate(ALGEBRA):
        sub_slug = claim(_slug(en, TOPIC_SLUG))
        plan.append({
            "slug": sub_slug, "icon": icon, "he": he, "en": en, "ar": ar,
            "sort_order": s_idx,
            "lessons": [
                {"slug": claim(_slug(l_en, sub_slug)), "he": l_he, "en": l_en, "ar": l_ar, "sort_order": l_idx}
                for l_idx, (l_he, l_en, l_ar) in enumerate(lessons)
            ],
        })
    return plan


async def load_algebra(session: AsyncSession) -> dict[str, int]:
    from app.models.lesson import Lesson
    from app.models.subtopic import Subtopic
    from app.models.topic import Topic

    topic = await session.scalar(select(Topic).where(Topic.slug == TOPIC_SLUG))
    if topic is None:
        raise RuntimeError(f"Topic '{TOPIC_SLUG}' not found")

    counts = {"subtopics_created": 0, "subtopics_updated": 0, "lessons_created": 0, "lessons_updated": 0}

    for sd in build_plan():
        sub = await session.scalar(select(Subtopic).where(Subtopic.slug == sd["slug"]))
        if sub is None:
            sub = Subtopic(topic_id=topic.id, slug=sd["slug"])
            session.add(sub)
            counts["subtopics_created"] += 1
        else:
            counts["subtopics_updated"] += 1
        sub.topic_id = topic.id
        sub.name_he, sub.name_en, sub.name_ar = sd["he"], sd["en"], sd["ar"]
        sub.icon = sd["icon"]
        sub.sort_order = sd["sort_order"]
        sub.is_published = True
        await session.flush()

        for ld in sd["lessons"]:
            lesson = await session.scalar(select(Lesson).where(Lesson.slug == ld["slug"]))
            if lesson is None:
                lesson = Lesson(subtopic_id=sub.id, slug=ld["slug"])
                session.add(lesson)
                counts["lessons_created"] += 1
            else:
                counts["lessons_updated"] += 1
            lesson.subtopic_id = sub.id
            lesson.name_he, lesson.name_en, lesson.name_ar = ld["he"], ld["en"], ld["ar"]
            lesson.sort_order = ld["sort_order"]
            lesson.is_published = True

    await session.commit()
    return counts


async def main() -> None:
    import app.models  # noqa: F401  (register every model)
    from app.database import async_session, engine

    async with async_session() as session:
        print(await load_algebra(session))
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
