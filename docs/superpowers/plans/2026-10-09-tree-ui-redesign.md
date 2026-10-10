# Tree UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every student page look like `docs/design/tree-mockup.html`, keep the presentation player working, and make topics, subtopics and home-page texts fully editable from the admin and persisted in Postgres.

**Architecture:** The mockup's markup/CSS is ported into the existing React pages (no UI library). The backend gains `subtopics.icon` (Alembic 002) and a public `GET /api/v1/site-content` built from the existing `site_config` key/value table. The admin edits those keys through the existing `/api/v1/admin/settings` endpoint on a new "Home content" page. The seed only inserts missing keys and fills empty icons, so redeploys never overwrite admin edits. `PresentationViewer` is reused **unchanged**; the lesson page only wraps it.

**Tech Stack:** FastAPI + SQLAlchemy async + Alembic + pytest; React 19 + Vite + react-router 7 + react-i18next (`frontend/`); React 19 + TanStack Query + Tailwind (`admin-frontend/`).

**Spec:** `docs/superpowers/specs/2026-10-09-tree-ui-redesign-design.md` · **Visual reference:** `docs/design/tree-mockup.html`

## Conventions

- Commit after each task. Every commit message ends with `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
- Backend commands run from `backend/`: `.venv/bin/python -m pytest …` (baseline: 96 passed).
- Lint baseline (pre-existing, out of scope):
  - `frontend`: 5 errors in `GeoGebraViewer.tsx` and `pages/admin/*EditorPage.tsx`, plus 2 in `HomePage.tsx`/`TopicPage.tsx`; this plan rewrites those two pages, removing their errors.
  - `admin-frontend`: 3 errors (`FilterBar.tsx`, `AuthContext.tsx`) and 1 warning (`SettingsPage.tsx`).
  - **Gate:** no new lint problems in touched files; both builds keep passing.
- `admin-frontend` imports `frontend/src/components/content/PresentationViewer.tsx`, so `frontend/node_modules` must exist for the admin build.
- Deviation from spec: the app has no Contact page, so footer links are Home `/`, About `/#about`, Topics `/#topics` (no dead links).

---

### Task 0: Environment

- [ ] Install:
  - `(cd frontend && npm install --no-audit --no-fund && git checkout package-lock.json)`
  - `(cd admin-frontend && npm ci)`
  - `(cd backend && python3.13 -m venv .venv && .venv/bin/pip install -r requirements.txt pytest pytest-asyncio aiosqlite)`
- [ ] Baseline:
  - `cd backend && .venv/bin/python -m pytest -q` → 96 passed.
  - `node --test frontend/tests/playerProtocol.test.ts backend/tests/presentation-player.test.cjs` → pass.

---

### Task 1: Backend — subtopic icon column

**Files:**
- Modify: `backend/app/models/subtopic.py`, `backend/app/schemas/subtopic.py`, `backend/app/schemas/public.py`, `backend/app/api/public/topics.py`
- Create: `backend/alembic/versions/002_subtopic_icon.py`
- Test: `backend/tests/test_subtopic_icon.py`

- [ ] **Step 1: Failing tests** — create `backend/tests/test_subtopic_icon.py`:

```python
"""Subtopic icon: admin round-trip, public detail, and migration 002."""

import importlib.util
import pathlib

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations
from httpx import AsyncClient

from tests.test_subtopics import _subtopic_payload, _topic_payload

MIGRATION = (
    pathlib.Path(__file__).resolve().parents[1]
    / "alembic" / "versions" / "002_subtopic_icon.py"
)


async def test_subtopic_icon_round_trip(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    topic_resp = await async_client.post(
        "/api/v1/admin/topics", headers=headers, json=_topic_payload()
    )
    assert topic_resp.status_code == 201
    topic = topic_resp.json()

    created = await async_client.post(
        "/api/v1/admin/subtopics",
        headers=headers,
        json=_subtopic_payload(topic["id"], icon="f(x)"),
    )
    assert created.status_code == 201
    assert created.json()["icon"] == "f(x)"
    sub_id = created.json()["id"]

    updated = await async_client.put(
        f"/api/v1/admin/subtopics/{sub_id}", headers=headers, json={"icon": "Σ"}
    )
    assert updated.status_code == 200
    assert updated.json()["icon"] == "Σ"

    public = await async_client.get(f"/api/v1/topics/{topic['slug']}?locale=en")
    assert public.status_code == 200
    sub = next(s for s in public.json()["subtopics"] if s["id"] == sub_id)
    assert sub["icon"] == "Σ"


async def test_subtopic_icon_defaults_to_empty(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    topic = (
        await async_client.post("/api/v1/admin/topics", headers=headers, json=_topic_payload())
    ).json()
    created = await async_client.post(
        "/api/v1/admin/subtopics", headers=headers, json=_subtopic_payload(topic["id"])
    )
    assert created.status_code == 201
    assert created.json()["icon"] == ""


def _load_migration():
    spec = importlib.util.spec_from_file_location("migration_002", MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _columns(conn) -> set[str]:
    return {c["name"] for c in sa.inspect(conn).get_columns("subtopics")}


def test_migration_002_upgrade_is_idempotent_and_downgrades(tmp_path):
    engine = sa.create_engine(f"sqlite:///{tmp_path / 'migration.db'}")
    migration = _load_migration()
    with engine.begin() as conn:
        conn.execute(sa.text("CREATE TABLE subtopics (id VARCHAR(36) PRIMARY KEY)"))
        with Operations.context(MigrationContext.configure(conn)):
            migration.upgrade()
            assert "icon" in _columns(conn)
            migration.upgrade()
            assert "icon" in _columns(conn)
            migration.downgrade()
            assert "icon" not in _columns(conn)
    engine.dispose()
```


- [ ] **Step 2: Verify the tests fail.** Run `.venv/bin/python -m pytest tests/test_subtopic_icon.py -v`. Expected: FAIL.

- [ ] **Step 3: Model.** In `app/models/subtopic.py`, after `name_ar`, add:

```python
    icon: Mapped[str] = mapped_column(
        String(20), nullable=False, default="", server_default=""
    )
```

- [ ] **Step 4: Schemas.**
  - `app/schemas/subtopic.py` (import `Field` from pydantic):
    - `SubtopicCreate`: `icon: str = Field(default="", max_length=20)`
    - `SubtopicUpdate`: `icon: Optional[str] = Field(default=None, max_length=20)`
    - `SubtopicResponse`: `icon: str = ""`
  - `app/schemas/public.py`: in `PublicSubtopicWithLessons`, add `icon: str = ""` after `slug`.

- [ ] **Step 5: Public detail.** In `app/api/public/topics.py`, pass `icon=s.icon,` to `PublicSubtopicWithLessons(...)`.

- [ ] **Step 6: Migration.** Create `alembic/versions/002_subtopic_icon.py`:

```python
"""Add icon to subtopics

Revision ID: 002_subtopic_icon
Revises: 001_initial
Create Date: 2026-10-09 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "002_subtopic_icon"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def _has_icon() -> bool:
    columns = sa.inspect(op.get_bind()).get_columns("subtopics")
    return any(column["name"] == "icon" for column in columns)


def upgrade() -> None:
    # Idempotent: databases created by seeds.run_seed (create_all) may already have it.
    if not _has_icon():
        op.add_column(
            "subtopics",
            sa.Column("icon", sa.String(20), nullable=False, server_default=""),
        )


def downgrade() -> None:
    if _has_icon():
        op.drop_column("subtopics", "icon")
```

- [ ] **Step 7: Run tests.** Run `.venv/bin/python -m pytest -q`. Expected: all pass.
- [ ] **Step 8: Commit** with message `feat(backend): persist subtopic icon and expose it publicly`.

---

### Task 2: Backend — public site-content endpoint

**Files:**
- Create: `backend/app/services/site_content.py`, `backend/app/api/public/site_content.py`, `backend/tests/test_site_content.py`
- Modify: `backend/app/schemas/public.py`, `backend/app/main.py`

- [ ] **Step 1: Failing tests** — create `backend/tests/test_site_content.py`:

```python
"""Public home-page content built from site_config."""

import uuid

from httpx import AsyncClient

from app.services.site_content import DEFAULT_SITE_CONTENT, build_site_content


def test_defaults_when_keys_missing():
    content = build_site_content({}, "en")
    assert content["trust_cards"][0] == {
        "icon": "🏛️",
        "text": "Approved by the Ministry of Education",
    }
    assert len(content["trust_cards"]) == 3
    assert content["about"]["button_link"] == "/about-mathematics"
    assert content["about"]["title"].startswith("G-math")


def test_localized_value_wins():
    content = build_site_content({"home.about.title_ar": "عنوان"}, "ar")
    assert content["about"]["title"] == "عنوان"


def test_empty_locale_value_falls_back_to_hebrew():
    settings = {"home.trust.2.text_he": "עברית בלבד", "home.trust.2.text_en": ""}
    content = build_site_content(settings, "en")
    assert content["trust_cards"][1]["text"] == "עברית בלבד"


def test_every_default_key_is_namespaced():
    assert all(key.startswith("home.") for key in DEFAULT_SITE_CONTENT)
    assert "home.trust.3.icon" in DEFAULT_SITE_CONTENT


async def test_endpoint_reflects_admin_settings(async_client: AsyncClient, admin_token: str):
    value = f"Trust {uuid.uuid4().hex[:6]}"
    saved = await async_client.put(
        "/api/v1/admin/settings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"settings": {"home.trust.3.text_en": value}},
    )
    assert saved.status_code == 200

    resp = await async_client.get("/api/v1/site-content?locale=en")
    assert resp.status_code == 200
    body = resp.json()
    assert body["trust_cards"][2]["text"] == value
    assert set(body["about"]) == {"title", "body", "button_text", "button_link"}


async def test_endpoint_rejects_unknown_locale(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/site-content?locale=fr")
    assert resp.status_code == 422
```

- [ ] **Step 2: Verify the tests fail** (`ModuleNotFoundError`).

- [ ] **Step 3: Service.** Create `app/services/site_content.py` containing:
  - `LOCALES = ("he", "en", "ar")`.
  - `_TRUST_CARDS`: a list of `(icon, {he, en, ar})` with:
    - 🏛️ "האתר מאושר על ידי משרד החינוך" / "Approved by the Ministry of Education" / "معتمد من وزارة التربية والتعليم"
    - 🎁 "כל תכני האתר נגישים בחינם" / "All website content is free to access" / "جميع محتويات الموقع متاحة مجاناً"
    - 📚 "ריכוז עצום של שיעורים ומצגות לכל הרמות" / "A huge collection of lessons and presentations for all levels" / "مجموعة ضخمة من الدروس والعروض لجميع المستويات"
  - `_ABOUT`: `{title, body, button}` × `{he, en, ar}`.
    - Hebrew comes from mockup lines 318–321.
    - The body has two paragraphs separated by `\n\n`.
    - EN/AR are faithful translations.
    - Button: "עוד קצת עלינו" / "More about us" / "المزيد عنا".
  - `DEFAULT_SITE_CONTENT` keys:
    - `home.trust.{1..3}.icon`
    - `home.trust.{n}.text_{loc}`
    - `home.about.{title,body,button}_{loc}`
    - `home.about.button_link = "/about-mathematics"`
  - Functions:

```python
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
```

- [ ] **Step 4: Schemas.** Append to `app/schemas/public.py`:
  - `PublicTrustCard(icon: str, text: str)`
  - `PublicAbout(title, body, button_text, button_link: str)`
  - `PublicSiteContent(trust_cards: List[PublicTrustCard], about: PublicAbout)`

- [ ] **Step 5: Router.** Create `app/api/public/site_content.py`:

```python
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.public import PublicSiteContent
from app.services.settings import get_all_settings
from app.services.site_content import build_site_content

router = APIRouter(prefix="/api/v1/site-content", tags=["site-content"])


@router.get("", response_model=PublicSiteContent)
async def read_site_content(
    locale: Literal["he", "en", "ar"] = Query("he"),
    db: AsyncSession = Depends(get_db),
):
    """Localized home-page texts (trust cards + About section)."""
    return build_site_content(await get_all_settings(db), locale)
```

  Register it in `app/main.py` right after the hero router.

- [ ] **Step 6: Run tests.** Run `.venv/bin/python -m pytest -q`. Expected: all pass.
- [ ] **Step 7: Commit** with message `feat(backend): add public site-content endpoint backed by site_config`.

---

### Task 3: Backend — non-destructive seeding

**Files:**
- Modify: `backend/seeds/seed_data.py`, `backend/seeds/run_seed.py`
- Test: `backend/tests/test_seed_site_content.py`

- [ ] **Step 1: Failing tests** — create `backend/tests/test_seed_site_content.py`:

```python
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
```

- [ ] **Step 2: Verify the tests fail** (`ImportError`).

- [ ] **Step 3: Implement in `seeds/seed_data.py`.**
  - Import `DEFAULT_SITE_CONTENT`.
  - Add `SUBTOPIC_ICONS = ["=", "f(x)", "∑", "{}", "√", "log", "∪", "[ ]", "≤", "|x|"]`.
  - In `seed_all`, pass `icon=SUBTOPIC_ICONS[s_idx % len(SUBTOPIC_ICONS)]` to each `Subtopic(...)`.
  - Append:

```python
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
```

- [ ] **Step 4: Update `seeds/run_seed.py`.**
  - After `seed_all`, call `seed_site_content` and `backfill_subtopic_icons` in the same session.
  - Print: `✅  Home content keys added: N; subtopic icons filled: M.`
- [ ] **Step 5: Run tests.** Run `.venv/bin/python -m pytest -q`. Expected: all pass.
- [ ] **Step 6: Commit** with message `feat(seed): add home content keys and subtopic icons without overwriting edits`.

---

### Task 4: Admin — complete topic and subtopic forms

**Files:**
- Modify: `admin-frontend/src/types/index.ts`, `src/api/topics.ts`, `src/components/ModalForm.tsx`, `src/pages/TopicsPage.tsx`, `src/pages/SubtopicsPage.tsx`

- [ ] **Step 1: Types.** Add `sort_order: number` to `Topic`, `Subtopic`, `TopicRecord` and `SubtopicRecord`.

- [ ] **Step 2: API mapping** (`api/topics.ts`):

```ts
// The backend requires non-empty EN/AR names; fall back to Hebrew when left blank.
function namePayload(name?: LocalizedText) {
  if (!name) return {};
  const he = name.he.trim();
  return { name_he: he, name_en: name.en.trim() || he, name_ar: name.ar.trim() || he };
}
```

  - `topicPayload` sends:
    - icon, color, bg_color
    - `...namePayload`
    - description_he, description_en, description_ar
    - sort_order, is_published
  - `subtopicPayload` sends: topic_id, `icon`, `...namePayload`, sort_order, is_published.
  - Map `sort_order` in `useTopics`/`useSubtopics`.
  - Sort topics, and each parent's subtopics before flattening, by `sort_order`.

- [ ] **Step 3: ModalForm.**
  - Add `'number'` to the field type union.
  - The text input renders `type={field.type === 'number' ? 'number' : 'text'}`.

- [ ] **Step 4: TopicsPage.**
  - Form fields:
    - icon
    - name_he (required)
    - name_en and name_ar (label "ריק = כמו בעברית")
    - description_he, description_en, description_ar (textarea)
    - color, bg_color
    - sort_order (number; default `topics.length` for new topics)
    - status
  - `handleSubmit` builds name/description from all three languages and `sort_order: Number.parseInt(..) || 0`.
  - Add a sortable "סדר" column.

- [ ] **Step 5: SubtopicsPage `SubtopicForm`.**
  - New state: `nameAr`, `sortOrder`, `published`.
  - Inputs: Arabic name (`dir="rtl"`), number input for display order, "פורסם באתר" checkbox. The English name gets `dir="ltr"`.
  - Payload: `{ topic_id, icon, name: {he, en, ar}, sort_order, status }`. `icon` is always sent, so it can be cleared.

- [ ] **Step 6: Verify.** Run `cd admin-frontend && npm run build && npm run lint`. Expected: build passes; lint shows only the baseline problems.
- [ ] **Step 7: Commit** with message `feat(admin): edit all topic/subtopic languages, order and publish state`.

---

### Task 5: Admin — Home content page

**Files:**
- Modify: `admin-frontend/src/api/settings.ts`, `src/App.tsx`, `src/layouts/AdminLayout.tsx`, `src/i18n/index.ts`
- Create: `admin-frontend/src/pages/HomeContentPage.tsx`

- [ ] **Step 1: Hooks** in `api/settings.ts`:

```ts
interface SettingsEnvelope { settings: Record<string, string> }

export function useSiteSettings() {
  return useQuery<Record<string, string>>({
    queryKey: ['site-settings'],
    queryFn: async () => (await api.get<SettingsEnvelope>('/admin/settings')).settings,
  });
}

export function useSaveSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, string>) =>
      api.put<SettingsEnvelope>('/admin/settings', { settings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('תוכן דף הבית נשמר');
    },
    onError: () => toast.error('שגיאה בשמירת תוכן דף הבית'),
  });
}
```

- [ ] **Step 2: Page.** `HomeContentPage` renders `<HomeContentForm key={dataUpdatedAt} initial={data} />` with loading and error states.
  - The form keeps one `Record<string,string>` state over the `KEYS` list:
    - 3 trust cards × (icon + text_he/en/ar)
    - about title/body/button × he/en/ar
    - `home.about.button_link`
  - Layout:
    - Section "🤝 כרטיסי אמון": three fieldsets.
    - Section "🌳 אודות": one fieldset per language. The body is a 6-row textarea with the hint "שורה ריקה = פסקה חדשה".
    - A link field (`dir="ltr"`).
    - Inputs use `dir` per language.
  - Submit calls `save.mutate(values)`; the button is disabled while pending.
- [ ] **Step 3: Wiring.**
  - Route `home-content` after `hero`.
  - Nav item `{ to: '/admin/home-content', label: 'homeContent', icon: '🏠' }`.
  - i18n `homeContent`: he 'תוכן דף הבית', en 'Home content', ar 'محتوى الصفحة الرئيسية'.
- [ ] **Step 4: Verify.** Run `npm run build && npm run lint`. Expected: only baseline lint problems.
- [ ] **Step 5: Commit** with message `feat(admin): add Home content page for trust cards and About texts`.

---

### Task 6: Frontend — data layer and strings

**Files:**
- Create: `frontend/src/hooks/useApi.ts`, `frontend/src/api/siteContent.ts`, `frontend/src/utils/siteContentDefaults.ts`
- Modify: `frontend/src/types/index.ts`, `frontend/src/api/hero.ts`, `frontend/src/i18n/locales/{he,en,ar}/common.json`

- [ ] **Step 1: `useApi`.** It loads data without a synchronous setState in an effect: state is keyed by request, and stale state is derived away.

```ts
import { useCallback, useEffect, useState } from 'react';

interface Settled<T> { key: string; data?: T; error?: unknown }

export function useApi<T>(key: string | null, load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const requestKey = key === null ? null : `${key}#${attempt}`;

  useEffect(() => {
    if (requestKey === null) return;
    let cancelled = false;
    load().then(
      data => { if (!cancelled) setSettled({ key: requestKey, data }); },
      error => { if (!cancelled) setSettled({ key: requestKey, error }); },
    );
    return () => { cancelled = true; };
    // `load` is recreated each render; the request identity is `requestKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const current = settled && settled.key === requestKey ? settled : null;
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return {
    data: current?.data,
    error: current?.error,
    loading: requestKey !== null && current === null,
    retry,
  };
}
```

- [ ] **Step 2: Types and API.**
  - Add `icon: string` to `PublicSubtopic`.
  - Add `PublicSiteContent { trust_cards: {icon,text}[]; about: {title, body, button_text, button_link} }`.
  - `getHeroSlides(locale)` → `/hero-slides?locale=${locale}`.
  - `getSiteContent(locale)` → `/site-content?locale=${locale}`.
- [ ] **Step 3: i18n.** In all three locales add top-level `skip_to_content`, `footer_nav`, `nav_topics`, plus a `tree` object with:
  - heroTitle, heroSubtitle, topicsHeading, statTopics, statLessons, statFree
  - trust1–3, aboutTitle, aboutBody, aboutButton
  - backToTopics, search, noMatches, lessonsCount (`{{count}}`), topicTabs
  - notFound, backHome, presentationsBadge (`{{count}}`)
  - previousLesson, nextLesson, lessonsButton, close, filterLessons, currentLesson
  - loadError, retry, breadcrumb

  Strings come from mockup lines 372–374 (HE), with EN/AR equivalents.
- [ ] **Step 4: Defaults.** `utils/siteContentDefaults.ts` exports `fallbackSiteContent(t): PublicSiteContent`, built from the `tree.trust*`/`tree.about*` strings. The home page uses it when `/site-content` fails.
- [ ] **Step 5: Verify.** Run `cd frontend && npm run build`. Expected: pass.
- [ ] **Step 6: Commit** with message `feat(frontend): add data hooks, site-content API and tree strings`.

---

### Task 7: Frontend — theme, header and footer

**Files:**
- Rewrite: `frontend/src/index.css`
- Modify: `frontend/src/components/layout/{AppShell,Header}.tsx`

- [ ] **Step 1: `index.css`.**
  - Port the mockup's `:root` variables and base/header/footer/language/zoom CSS (mockup lines 9–30 and 190–235) to the class names below.
  - Keep legacy aliases used by `PresentationViewer.css`/`LessonPage.css`: `--bg`, `--bg-secondary`, `--border`, `--g-blue`, `--g-blue-light`, `--text-primary`, `--text-secondary`.
  - Keep the `html[data-text-size]` → `--text-scale` rules and `html{font-size:calc(16px*var(--text-scale))}`.
  - Classes:
    - Header: `.hdr .logo .lg .lm .lt`
    - Footer: `.ftr .fb .fn .ft .dv` (fixed footer, so the body gets `padding-bottom:52px`)
    - Language switcher: `.lang-switcher .lang-btn` (mockup `.ls .lb` look)
    - Text-size control: `.text-size-control` (mockup `.zg` look)
    - Utilities: `.sr-only`, `.skip-link`, `:focus-visible` ring, `.state-msg`, `@keyframes fu` fade-in using `--si`
  - Under `prefers-reduced-motion`, disable all animations and transitions.
  - Legacy `/admin` pages in this app use no `index.css` classes, so they are unaffected.
- [ ] **Step 2: Header.** `<header className="hdr"><Link to="/" className="logo"><span className="lg">G</span><span className="lm">Math</span><span className="lt">{t('tagline')}</span></Link></header>`
- [ ] **Step 3: AppShell.**
  - Skip link to `#main-content`.
  - `<main id="main-content" tabIndex={-1}>`.
  - Footer contains:
    - `.fb` brand: `G-Math · tagline · © year`
    - `nav.fn` with `aria-label={t('footer_nav')}`: Home `/`, About `/#about`, Topics `/#topics`
    - `.ft` with `TextSizeControl`, a `.dv` divider, and `LanguageSwitcher`
- [ ] **Step 4: Verify.** Run `npm run build && npm run lint`. Expected: no new problems.
- [ ] **Step 5: Commit** with message `feat(frontend): tree theme, header and footer`.

---

### Task 8: Frontend — home page

**Files:**
- Rewrite: `frontend/src/pages/student/HomePage.tsx`
- Create: `frontend/src/pages/student/HomePage.css`, `frontend/src/components/home/{TreeIllustration,TrustCards,AboutSection}.tsx`

- [ ] **Step 1: Components.**
  - `TreeIllustration`: the mockup tree SVG (lines 263–316) as JSX, with `aria-hidden` and React attribute names.
  - `TrustCards`: `ul.trust > li.trust-card` showing icon + text, with `--si` stagger.
  - `AboutSection` (`id="about"`):
    - Title: "G-math" is wrapped in `<span className="hl">` via `split(/(G-math)/i)`.
    - Body: split on `/\n\s*\n/` into `<p>` elements.
    - Button: a `<Link>` if `button_link` starts with `/`, otherwise `<a href>`.
    - Tree illustration beside the text.
- [ ] **Step 2: HomePage.**
  - Data: three `useApi` calls keyed by locale (topics, hero slides, site content).
  - Hero `.hero`:
    - Floating math symbols (`aria-hidden`).
    - h1/subtitle from the first hero slide, or i18n fallback with `<span>GMath</span>` highlighted.
    - Stats pill `.stb`: topic count, sum of `lesson_count`, "free".
  - Trust cards and About from site content, or `fallbackSiteContent(t)` on error/loading.
  - `section#topics.tsc` with h2 and `ul.tg`. Each `li > Link.tc` has `style={{'--cc': topic.color}}` and shows icon (bg_color), name, description and lesson count.
  - Topics loading → `.state-msg[role=status]`; topics error → `.state-msg[role=alert]` with a retry button.
- [ ] **Step 3: CSS.** Port mockup lines 31–76 and 120–145 (hero, stats, trust, topic grid, about) into `HomePage.css`, including the 900px/600px/768px responsive rules.
- [ ] **Step 4: Verify.** Run `npm run build && npm run lint` (`HomePage.tsx` baseline error gone).
- [ ] **Step 5: Commit** with message `feat(frontend): tree home page with editable trust/about content`.

---

### Task 9: Frontend — topic page (and subtopic deep link)

**Files:**
- Rewrite: `frontend/src/pages/student/TopicPage.tsx`
- Create: `frontend/src/pages/student/TopicPage.css`, `frontend/src/utils/topicColors.ts`, `frontend/src/components/topic/{TopicBanner,SubtopicGlyph}.tsx`
- Modify: `frontend/src/App.tsx`
- Delete: `frontend/src/pages/student/SubtopicPage.tsx`

- [ ] **Step 1: `utils/topicColors.ts`.**
  - `hexToHsl(hex)`.
  - `shadeGradient(hex, index, total)`: port of mockup `shadeGrad`, returns a `linear-gradient(...)` string.
  - `FALLBACK_SUBTOPIC_ICONS` (same 10 glyph strings as the seed).
- [ ] **Step 2: `SubtopicGlyph`.**
  - Renders the matching mockup SVG glyph for the 10 known icon strings (mockup `subVis`, lines ~480–560).
  - Any other string renders as large text inside the same frame.
- [ ] **Step 3: `TopicBanner`.**
  - Mockup banner SVG (lines 459–478), coloured with the topic colour.
  - Back link `← backToTopics` to `/`; the chevron is mirrored in RTL.
  - `nav.tp-nav[aria-label=topicTabs]` of all topics as `<Link>`s with `--nav-c` and `aria-current="page"` on the current one.
- [ ] **Step 4: `TopicPage`.**
  - Routing: mounted on both `/:topicSlug` and `/:topicSlug/:subtopicSlug`.
  - Data: `useApi` for `getTopic` and `getTopics` (tabs).
  - Header and search:
    - Visually hidden h1 with the topic name.
    - Search input (`.tp-search`) filters subtopics by subtopic or lesson name. The query is stored as `{slug, text}` so it resets per topic.
  - Subtopic cards `ul.tp-grid > li > article.tp-card`:
    - Style `--c: topic.color` plus a `shadeGradient` header.
    - A `<button aria-expanded aria-controls>` with glyph, name and lesson count toggles `.expanded`.
    - Expanded = `toggled[slug] ?? slug === subtopicSlug`.
    - Lessons list `.tp-lessons` (`id` matched by `aria-controls`) of `Link.tp-lbtn` to `/${topic}/${sub}/${lesson}` with `--hover-c`.
    - Collapsed lessons use `max-height:0; visibility:hidden`; they open on `.expanded` or on hover (`@media (hover:hover)`).
  - Deep link: when `subtopicSlug` is set, an effect `scrollIntoView({block:'center'})` targets that card's element (by ref map), with no setState.
  - States: no search matches → `.state-msg`; unknown topic (404 `ApiError`) → not-found with link home; other errors → retry.
- [ ] **Step 5: Routes.** In `App.tsx`, route `/:topicSlug/:subtopicSlug` to `<TopicPage />`, remove the `SubtopicPage` import, and delete the file.
- [ ] **Step 6: CSS.** Port mockup lines 77–119 (banner, nav, search, cards, lesson buttons) and responsive rules into `TopicPage.css`.
- [ ] **Step 7: Verify.** Run `npm run build && npm run lint` (`TopicPage.tsx` baseline error gone).
- [ ] **Step 8: Commit** with message `feat(frontend): tree topic page with expandable subtopic cards`.

---

### Task 10: Frontend — lesson page around the unchanged player

**Files:**
- Modify: `frontend/src/pages/student/LessonPage.tsx`, `frontend/src/pages/student/LessonPage.css`
- Create: `frontend/src/components/lesson/{LessonToolbar,LessonDrawer}.tsx`

- [ ] **Step 1: Keep player behaviour.**
  - Keep the existing `labels` object, `selectPresentation`, `?presentation` handling and the `<PresentationViewer …/>` props exactly as they are.
  - Do **not** edit `PresentationViewer.tsx`, `PresentationNavigation.tsx` or `usePresentationPlayer.ts`.
- [ ] **Step 2: Layout.**
  - `nav.bc` breadcrumb: 🏠 Home / topic / subtopic (links) / lesson.
  - `.lp-wrap`:
    - `.lp-title` with h1 (`<bdi>`) and `.pb` badge (`presentationsBadge` count).
    - `.vf` stage containing `.lesson-player > PresentationViewer` (or the existing empty state).
    - `LessonToolbar`.
- [ ] **Step 3: Siblings.** `useApi(['topic', topic_slug, locale])` loads the topic. Siblings are the current subtopic's ordered lessons; its failure only hides prev/next.
- [ ] **Step 4: `LessonToolbar`** (`.vc`, sticky at `bottom:52px` above the footer):
  - Previous/next lesson `Link.nb`; disabled spans at the ends.
  - Position text `.nc` (`3 / 8`).
  - A `button.ls-btn` (aria-expanded) opens the drawer.
- [ ] **Step 5: `LessonDrawer`** (mockup `.ov-*`, lines 167–200):
  - Fixed `div.ov-back` backdrop plus `div.ov-panel[role=dialog][aria-modal][aria-labelledby]`; `inert` when closed.
  - Header with close button; filter input; list of `Link.ov-it` with number, name and `ov-now` "current" chip (`aria-current="page"`).
  - Closes on Escape, backdrop click or link click.
  - On open, focus goes to the filter input; on close, focus returns to the toggle button.
  - The filter state resets on close (the component remounts via `key`).
- [ ] **Step 6: CSS.** Port mockup lines 146–200 into `LessonPage.css` (keep the existing `.lesson-player`/`.lesson-empty` rules that the viewer layout relies on).
- [ ] **Step 7: Verify.**
  - `npm run build && npm run lint`
  - `node --test frontend/tests/playerProtocol.test.ts backend/tests/presentation-player.test.cjs`
- [ ] **Step 8: Commit** with message `feat(frontend): tree lesson page with lesson drawer around the player`.

---

### Task 11: Docs

- [ ] `docs/API.md`: document `GET /api/v1/site-content?locale=`, the `icon` field on subtopics (admin and public), and the `home.*` settings keys.
- [ ] `README.md` (seed section), deployment note:
  - Fresh DB → `alembic upgrade head` then `python -m seeds.run_seed`.
  - A DB created by `run_seed` → `alembic stamp 001_initial && alembic upgrade head`.
  - The seed never overwrites admin edits.
  - Never `docker compose down -v` on a deployed DB.
- [ ] `.squad/decisions/inbox/tree-ui-admin-content.md`: topics/subtopics/home texts are admin-editable and persisted; supersedes `elrond-topic-mutability.md` and `elrond-nine-main-topics.md` where they conflict.
- [ ] **Commit** with message `docs: site-content API, subtopic icons and deploy notes`.

---

### Task 12: Verification

- [ ] Automated checks:
  - `cd backend && .venv/bin/python -m pytest -q`
  - `npm run build && npm run lint` in both frontends
  - `node --test …` player tests
- [ ] Postgres:
  - Start a separate compose project (`docker compose -p gmath-tree up -d db`) or reuse a local Postgres.
  - Run `alembic upgrade head` then `python -m seeds.run_seed` twice (second run adds 0).
  - Confirm `subtopics.icon` exists.
- [ ] Run the backend and both Vite dev servers on this branch. The running Docker containers belong to another worktree, so use different ports.
- [ ] Browser canvas, in HE and EN, at desktop and 390px widths:
  - Home matches the mockup.
  - The topic page expands cards.
  - A deep link to a subtopic scrolls to it.
  - The lesson page plays a presentation; page navigation and full page work; the drawer opens and closes with the keyboard.
- [ ] Admin round-trip:
  - Edit a trust-card text, the About title and a subtopic icon/name/order in the admin.
  - Reload the student site and confirm the changes appear.
  - Re-run the seed and confirm the edits survive.
