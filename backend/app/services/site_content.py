"""Localized home-page content (trust cards + About section) stored in site_config."""

LOCALES = ("he", "en", "ar")

_TRUST_CARDS: list[tuple[str, dict[str, str]]] = [
    (
        "🏛️",
        {
            "he": "האתר מאושר על ידי משרד החינוך",
            "en": "Approved by the Ministry of Education",
            "ar": "معتمد من وزارة التربية والتعليم",
        },
    ),
    (
        "🎁",
        {
            "he": "כל תכני האתר נגישים בחינם",
            "en": "All website content is free to access",
            "ar": "جميع محتويات الموقع متاحة مجاناً",
        },
    ),
    (
        "📚",
        {
            "he": "ריכוז עצום של שיעורים ומצגות לכל הרמות",
            "en": "A huge collection of lessons and presentations for all levels",
            "ar": "مجموعة ضخمة من الدروس والعروض لجميع المستويات",
        },
    ),
]

_ABOUT: dict[str, dict[str, str]] = {
    "title": {
        "he": "G-math הוקמה כדי להעניק לכל תלמידי ישראל הזדמנות שווה לצמיחה.",
        "en": "G-math was founded to give every student in Israel an equal opportunity to grow.",
        "ar": "G-math تأسست لتمنح جميع طلاب إسرائيل فرصة متكافئة للنمو.",
    },
    "body": {
        "he": (
            "הפרויקט נוסד מתוך חזונה של שרה גרז׳וטיס, מורה ותיקה למתמטיקה – "
            "להנגיש את עולמות המספרים והצורות לכל תלמיד ותלמידה."
            "\n\n"
            "מתוך הבנה של האתגרים שבלמידה, במיוחד עבור תלמידים שמתקשים להתרכז או להתמיד, "
            "האתר מרכז מאות מצגות ושיעורים ברמה גבוהה, המותאמים באופן אישי לרמות השונות. "
            "כאן, כל אחד יכול למצוא גישה חדשה ונגישה למתמטיקה, "
            "כזו שמאפשרת להתגבר על מכשולים ולהצליח."
        ),
        "en": (
            "The project was founded out of the vision of Sarah Grazutis, a veteran "
            "mathematics teacher – to make the worlds of numbers and shapes accessible "
            "to every student."
            "\n\n"
            "Out of an understanding of the challenges of learning, especially for students "
            "who struggle to concentrate or persevere, the site brings together hundreds of "
            "high-quality presentations and lessons, personally tailored to different levels. "
            "Here, everyone can find a new and accessible approach to mathematics – one that "
            "makes it possible to overcome obstacles and succeed."
        ),
        "ar": (
            "تأسس المشروع انطلاقاً من رؤية سارة غرازوتيس، معلمة رياضيات ذات خبرة طويلة – "
            "لإتاحة عوالم الأعداد والأشكال لكل طالب وطالبة."
            "\n\n"
            "انطلاقاً من فهم تحديات التعلم، وخاصة للطلاب الذين يجدون صعوبة في التركيز أو المثابرة، "
            "يجمع الموقع مئات العروض والدروس عالية المستوى، المصممة بشكل شخصي لتناسب المستويات المختلفة. "
            "هنا، يمكن للجميع أن يجدوا نهجاً جديداً وسهل الوصول إلى الرياضيات، "
            "نهجاً يتيح التغلب على العقبات والنجاح."
        ),
    },
    "button": {
        "he": "עוד קצת עלינו",
        "en": "More about us",
        "ar": "المزيد عنا",
    },
}


def _build_defaults() -> dict[str, str]:
    defaults: dict[str, str] = {}
    for n, (icon, texts) in enumerate(_TRUST_CARDS, start=1):
        defaults[f"home.trust.{n}.icon"] = icon
        for loc in LOCALES:
            defaults[f"home.trust.{n}.text_{loc}"] = texts[loc]
    for field, texts in _ABOUT.items():
        for loc in LOCALES:
            defaults[f"home.about.{field}_{loc}"] = texts[loc]
    defaults["home.about.button_link"] = "/about-mathematics"
    return defaults


DEFAULT_SITE_CONTENT: dict[str, str] = _build_defaults()


def _get(settings: dict[str, str], key: str) -> str:
    """Stored value if the key exists (even if empty), otherwise the built-in default."""
    return settings[key] if key in settings else DEFAULT_SITE_CONTENT.get(key, "")


def _localized(settings: dict[str, str], base: str, locale: str) -> str:
    value = _get(settings, f"{base}_{locale}")
    if not value.strip() and locale != "he":
        value = _get(settings, f"{base}_he")
    return value


def build_site_content(settings: dict[str, str], locale: str) -> dict:
    return {
        "trust_cards": [
            {
                "icon": _get(settings, f"home.trust.{n}.icon"),
                "text": _localized(settings, f"home.trust.{n}.text", locale),
            }
            for n in range(1, len(_TRUST_CARDS) + 1)
        ],
        "about": {
            "title": _localized(settings, "home.about.title", locale),
            "body": _localized(settings, "home.about.body", locale),
            "button_text": _localized(settings, "home.about.button", locale),
            "button_link": _get(settings, "home.about.button_link"),
        },
    }
