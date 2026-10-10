# Tree UI Redesign + Admin-Editable Topics & Home Content — Design

**Date:** 2026-10-09
**Status:** Approved (brainstorming)
**Visual reference:** `docs/design/tree-mockup.html` (copied from brainstorm session `38612-1775509184`, Apr 6 2026). Open it in a browser; it has three views: home, topic, lesson.

## Goal

1. Make the student web app **look like the tree mockup** on every page (home, topic, subtopic, lesson) instead of today's look.
2. Keep the merged **lesson presentation player** (`PresentationViewer`, `playerProtocol`, `usePresentationPlayer`) fully working inside the new lesson page.
3. Let the site owner edit, from the admin, **topics, subtopics, and the home-page texts**, with all edits persisted in Postgres and never overwritten by redeploys/seeding.

## Non-goals

- No deployment/hosting work (only "safe to deploy": persistence + idempotent seed).
- No change to the presentation player protocol or presentation upload flow.
- No new UI library; no embedding of the mockup HTML as-is.
- No changes to lessons/presentations admin beyond what exists.
- The about-section tree stays the drawn SVG (not uploadable).
- The legacy admin pages inside the student app (`frontend/src/pages/admin/*`, `/admin/*` routes) are untouched; the admin system is `admin-frontend/`.

## Architecture overview

```
frontend (React)                      backend (FastAPI)                   admin-frontend (React)
 HomePage ── getTopics ─────────────► GET /api/v1/topics                   TopicsPage   ─► /admin/topics (CRUD)
          ── getHeroSlides ─────────► GET /api/v1/hero-slides               SubtopicsPage─► /admin/subtopics (CRUD, +icon)
          ── getSiteContent ──NEW───► GET /api/v1/site-content  ◄── site_config ◄── PUT /admin/settings ◄── HomeContentPage NEW
 TopicPage ─ getTopics/getTopic ────► GET /api/v1/topics/{slug}  (subtopic.icon NEW)
 LessonPage ─ getLesson + getTopic ─► GET /api/v1/lessons/{slug}
          └─ PresentationViewer (unchanged behaviour)
```

## Part 1 — Student site restyle (`frontend/`)

Port the mockup's markup structure and CSS (class names `hero`, `trust-card`, `about-sec`, `tsc/tg` topic grid, `tp-banner/tp-nav/tp-card`, lesson breadcrumb/toolbar) into the React pages. Mockup CSS variables (`--g-green #4CAF50`, `--g-blue #1565C0`, `--tp`, `--ts`, `--bd`, `--r`, fonts Rubik/Assistant) become the global theme in `frontend/src/index.css`, replacing today's conflicting home/topic styles. Page-specific CSS lives in per-page files (`HomePage.css`, `TopicPage.css`, `LessonPage.css`) to keep `index.css` from growing further.

All texts go through i18n (`he`/`en`/`ar` `common.json`) using the mockup's strings (mockup `L.he/L.en/L.ar` object). RTL/LTR continues to be driven by `useDirection`. Use logical CSS properties (`inset-inline-start`, `margin-inline`) so RTL and LTR both render correctly. Respect `prefers-reduced-motion` for fade-in/floating animations.

### 1.1 Layout (Header / Footer — `AppShell`, `Header`)
- Header: mockup style — white bar, "GMath" logo (G green, Math blue) + tagline (`tl`), logo links to `/`.
- Footer: mockup style — `G-Math • tagline © year` on one side, links Home/About/Contact in the middle, and the existing **text-size control** and **language switcher** (HE/EN/AR pills) on the other side. Behaviour of both controls unchanged.

### 1.2 Home page (`/`)
Top-to-bottom, matching mockup `#p-home`:
1. **Hero:** soft green→blue→purple gradient with floating math symbols (∫ π Σ △ ∞ √ …). Title + subtitle from the **first active hero slide** (existing admin Hero page); fallback to i18n `ht`/`hs` when none. The word "GMath" inside the fallback title gets the gradient highlight. Stats pill: `{topics} נושאים · {subtopics} תתי-נושאים · {lessons} שיעורים` computed from `/topics` counts.
2. **Trust cards:** 3 white cards overlapping the bottom of the hero, each icon (emoji in tinted square) + text. Content from site content (Part 2.3).
3. **About section:** left/right split — the **SVG tree** (trunk, branches, leaf clusters, flowers, ground ellipse; copied verbatim from mockup lines 263–316) in a rounded green-gradient box, and text: heading (with "G-math" highlighted in blue), paragraph (supports line breaks), green button linking to `about.button_link`. Content from site content. Stacks vertically under 768px.
4. **Topics grid:** heading `📚 נושאי לימוד` and mockup topic cards (icon square tinted with `bg_color`, name, description), linking to `/{topic.slug}`.

Loading state: skeleton/"loading" text in the mockup style; error state: message + retry button.

### 1.3 Topic page (`/:topicSlug`) and subtopic URL (`/:topicSlug/:subtopicSlug`)
Matching mockup `#p-topic`:
1. **Banner:** 220px purple gradient with faint math-graphics SVG (parabola, sine, circle, triangle, formulas — copied from mockup) and, docked at its bottom, the **topic tab bar**: one tab per published topic (icon + name), active tab filled with the topic color (`--nav-c`), horizontally scrollable on mobile. Clicking a tab navigates to `/{slug}`.
2. **Bar:** "← Back to topics" link to `/` and a search input that filters subtopics and lessons by name (client-side).
3. **Subtopic cards grid:** each card has a top image area with gradient derived from the **topic color** (mockup `hsl()` logic: two lightness steps of the topic hue) + the subtopic **icon** as a large white overlay, then body with name and meta (`N lessons · M presentations` when presentation count is available, else `N lessons`). Clicking a card **expands it in place** to show its lessons list (mockup `toggleCard`), each lesson linking to `/{topic}/{subtopic}/{lesson}`. Keyboard: Enter/Space toggles; `aria-expanded` set.
4. `/:topicSlug/:subtopicSlug` renders the **same topic page** with that subtopic card pre-expanded and scrolled into view (replaces today's separate `SubtopicPage` look; existing links keep working). Unknown topic → not-found message with link home.

### 1.4 Lesson page (`/:topicSlug/:subtopicSlug/:lessonSlug`)
Matching mockup `#p-lesson`, wrapping the existing player:
1. **Breadcrumb bar:** `🏠 Home / Topic / Subtopic / Lesson` with links.
2. **Title row:** lesson name + pill badge `N presentations`.
3. **Stage:** rounded light-grey frame containing the existing **`PresentationViewer`** for the active presentation. The viewer's own behaviour (iframe sandbox, PDF/pptx handling, player protocol slide navigation, loading/slow/error overlays, expanded mode) is unchanged; only its outer container styles are adapted. Small corner chip `Presentations i / N`. If no presentations, show the mockup placeholder ("Presentation will display here").
4. **Bottom toolbar (sticky):**
   - Presentation pager: `← Previous`, numbered buttons `1 2 3`, `Next →`, `i / N` — switches between the lesson's presentations via the existing `?presentation=<id>` search param.
   - `📋 Lessons (N)` button opens a side **drawer** listing the subtopic's lessons (data from `getTopic(topicSlug)`), current lesson marked, each with its presentation count when known; closes on ✕/Escape/backdrop.
   - `⛶ Fullscreen` toggles the viewer's existing expanded/full-page mode.
   - `📥 Worksheet` links to the first non-presentation resource (worksheet) and is hidden when none exists. Other resources stay listed as today.

## Part 2 — Backend + admin (editable & persisted)

### 2.1 Subtopic icon (bug fix)
Admin `SubtopicsPage` already sends `icon`, but `Subtopic` has no `icon` column, so it is silently dropped.
- Model `backend/app/models/subtopic.py`: add `icon: str` (`String(20)`, nullable=False, server_default `''`).
- New Alembic migration `backend/alembic/versions/002_subtopic_icon.py` adding the column (downgrade drops it).
- Schemas `SubtopicCreate` / `SubtopicUpdate` / `SubtopicResponse` include `icon`.
- Public topic detail (`backend/app/schemas/public.py`, subtopic item) includes `icon`; frontend `PublicTopicDetail` subtopic type gains `icon`.
- Seed: give each seeded subtopic an icon matching the mockup visuals (e.g. Linear Equations `☰`, Quadratic `f(x)`, Functions `Σ`, Series `{}`), set only when the subtopic's icon is empty.

### 2.2 Topics & subtopics admin forms (complete fields)
`admin-frontend/src/pages/TopicsPage.tsx` and `SubtopicsPage.tsx` edit, via the existing CRUD endpoints (already persisted):
- Topic: icon, name HE/EN/**AR**, description HE/EN/**AR**, color, bg color, sort order, published.
- Subtopic: parent topic, icon, name HE/EN/**AR**, sort order, published.
Grouped in language tabs or labelled rows (HE/EN/AR); HE name required, EN/AR default to HE when left empty (backend requires non-empty `name_en`/`name_ar`). Lists show items ordered by `sort_order`; success/error toasts as today.

The earlier "9 main topics are immutable" decision (`.squad/decisions/inbox/elrond-topic-mutability.md`) is **superseded**: the owner explicitly wants full topic editing in admin. Record a short decision note in `.squad/decisions/inbox/`.

### 2.3 Home-page content (site content)
Stored in the existing `site_config` key/value table (no new table), keys:

| Key | Default (HE) |
|---|---|
| `home.trust.1.icon` / `.2.icon` / `.3.icon` | `🏛️` / `🎁` / `📚` |
| `home.trust.{1..3}.text_he` / `_en` / `_ar` | mockup `t1`/`t2`/`t3` in each language |
| `home.about.title_he` / `_en` / `_ar` | `G-math הוקמה כדי להעניק לכל תלמידי ישראל הזדמנות שווה לצמיחה.` (the leading "G-math" is highlighted by the frontend) |
| `home.about.body_he` / `_en` / `_ar` | mockup about paragraph (two paragraphs separated by a blank line) |
| `home.about.button_he` / `_en` / `_ar` | `עוד קצת עלינו` |
| `home.about.button_link` | `/about-mathematics` (first seeded topic) |

EN/AR defaults are translations of the Hebrew mockup text.

- **Public endpoint** `GET /api/v1/site-content?locale=he|en|ar` (new `backend/app/api/public/site_content.py`) returns
  `{ trust_cards: [{icon, text}], about: {title, body, button_text, button_link} }`, localized with fallback to `he` when a locale value is empty, and to built-in defaults when a key is missing.
- **Admin**: reuse existing `GET/PUT /api/v1/admin/settings` (already persists arbitrary keys). New admin page **"דף הבית / Home page"** (`admin-frontend/src/pages/HomeContentPage.tsx`, nav entry + route) with: 3 trust cards (icon + HE/EN/AR text) and About (title/body/button HE/EN/AR + link). Save → PUT settings → toast. Hero title/subtitle remain edited in the existing Hero page (first active slide drives the home hero).

### 2.4 Seeding & persistence
- `seeds/seed_data.py` gains `seed_site_content()` that inserts **only missing** `home.*` keys, and subtopic icon backfill that only fills empty icons. Topic/subtopic/lesson seeding keeps its existing "skip if data exists" behaviour.
- Postgres data stays in the `pgdata` volume; nothing on startup overwrites admin edits. README "Deploy" notes: run `alembic upgrade head` then seed; never `down -v` in production.

## Error handling
- Frontend: each page shows loading / error-with-retry states; site-content failure falls back to i18n defaults so the home page still renders; missing topic/subtopic/lesson → not-found message with link home.
- Backend: invalid locale → 422 (same as existing endpoints); missing site keys → defaults.
- Admin: validation of required HE name; API errors surface as toasts (existing pattern).

## Testing
- **Backend (pytest)**: subtopic icon create/update/read round-trip (admin + public detail); `/site-content` returns defaults, localized values, `he` fallback; `seed_site_content` inserts missing keys and does not overwrite existing ones; migration upgrade/downgrade on test DB.
- **Frontend**: `npm run build` and `npm run lint` pass for `frontend/` and `admin-frontend/`; existing `frontend/tests/playerProtocol.test.ts` still passes.
- **Visual/E2E check** in the browser canvas against `docs/design/tree-mockup.html` for home, topic (incl. expanded card and search), subtopic URL, lesson (pager, drawer, fullscreen, worksheet), in HE (RTL) and EN (LTR), desktop and mobile width; and an admin round-trip: edit a topic, a subtopic icon, and a trust card → reload student site → change visible.

## Files (expected)
- Frontend: `src/index.css`, `src/components/layout/{AppShell,Header}.tsx`, `src/pages/student/{HomePage,TopicPage,SubtopicPage,LessonPage}.tsx` + `.css`, new `src/components/home/{TrustCards,AboutSection,TreeIllustration}.tsx`, new `src/components/topic/{TopicBanner,SubtopicCard}.tsx`, new `src/components/lesson/{LessonToolbar,LessonDrawer}.tsx`, `src/api/siteContent.ts`, `src/types/index.ts`, `src/i18n/locales/*/common.json`, `src/App.tsx` (subtopic route → topic page).
- Backend: `app/models/subtopic.py`, `app/schemas/{subtopic,public}.py`, `app/api/public/{topics,site_content}.py`, router registration in `app/main.py`, `alembic/versions/002_subtopic_icon.py`, `seeds/seed_data.py`, tests under `backend/tests/`.
- Admin: `src/pages/{TopicsPage,SubtopicsPage,HomeContentPage}.tsx`, `src/api/{topics,settings}.ts`, routing/nav in `src/App.tsx` / layout.
- Docs: `docs/API.md` (site-content, subtopic icon), README deploy note, `.squad/decisions/inbox/` decision note.
