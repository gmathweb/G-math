# ADR-001: System Architecture for G-mathPOC

| Field     | Value                              |
|-----------|------------------------------------|
| **Status**    | Proposed                       |
| **Date**      | 2025-07-14                     |
| **Author**    | Elrond (Architect)             |
| **Reviewers** | Gandalf, Galadriel, Gimli, Legolas |

---

## Context

G-mathPOC is a multilingual math learning web platform for high school students and above. It must serve three types of content—HTML presentations, exercise working pages, and interactive GeoGebra applets—across three languages (Hebrew, English, Arabic) with mixed RTL/LTR directionality. There are no user accounts; access is open. A CMS dashboard allows teachers/admins to upload and manage content.

The project must be built with React, FastAPI, and PostgreSQL. This ADR establishes the foundational architecture that every subsequent implementation decision will build upon.

### Key Constraints

1. **Hebrew-first, RTL-native** — the platform must work flawlessly in RTL from day one, not as an afterthought.
2. **No user accounts** — no authentication for learners. CMS admins need simple auth.
3. **Content-heavy** — HTML files are the primary content unit; they are authored externally and imported.
4. **GeoGebra dependency** — interactive pages embed a third-party JavaScript applet engine.
5. **POC scope** — architecture must be simple enough to ship fast, but structured enough to extend.

---

## Decision

### 1. System Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTS                            │
│                                                         │
│   ┌──────────────┐         ┌──────────────────────┐    │
│   │  Student UI  │         │  CMS Admin Dashboard  │    │
│   │  (React SPA) │         │  (React SPA, same app)│    │
│   └──────┬───────┘         └──────────┬───────────┘    │
│          │                            │                 │
└──────────┼────────────────────────────┼─────────────────┘
           │          HTTPS             │
           ▼                            ▼
┌─────────────────────────────────────────────────────────┐
│                     NGINX                               │
│         (reverse proxy, static files, TLS)              │
│                                                         │
│   /api/*  → FastAPI       /* → React static build       │
│   /media/* → file storage (served directly)             │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
┌────────────────────┐    ┌───────────────────────┐
│   FastAPI Backend   │    │  Content File Storage  │
│                     │    │  (local filesystem,    │
│  • Public API       │    │   /media/content/)     │
│  • Admin API        │    │                        │
│  • File upload      │    │  • HTML presentations  │
│                     │    │  • Working page HTML   │
└──────────┬──────────┘    └───────────────────────┘
           │
           ▼
┌────────────────────┐
│    PostgreSQL       │
│                     │
│  • Content metadata │
│  • Course structure │
│  • GeoGebra configs│
│  • i18n content map │
└─────────────────────┘
```

**Key decision: Single React application** with route-based code splitting for student and admin views. Rationale:
- Shared component library (math rendering, RTL layout, i18n)
- Simpler deployment and build pipeline
- Admin routes are protected by a simple auth guard; student routes are fully open
- POC scope doesn't justify the overhead of two separate SPAs

### 2. Content Model

#### 2.1 Database Schema

```sql
-- ============================================================
-- 3-LEVEL TOPIC HIERARCHY
-- Level 1: Main Topics (9 math domains, e.g., Algebra, Geometry)
-- Level 2: Sub-Topics (e.g., Linear Equations, Quadratic Equations)
-- Level 3: Lessons (e.g., Factoring Quadratics, Completing the Square)
--          Each lesson has: presentation + working page + optional GeoGebra
-- ============================================================

-- Level 1: Main math topics (exactly 9)
CREATE TABLE topics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(100) UNIQUE NOT NULL,
    icon            VARCHAR(50),             -- emoji or icon class for UI
    color           VARCHAR(7),              -- hex color for topic branding
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_published    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE topic_translations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id        UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    locale          VARCHAR(5) NOT NULL,  -- 'he', 'en', 'ar'
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    UNIQUE(topic_id, locale)
);

-- Level 2: Sub-topics within a main topic
CREATE TABLE subtopics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id        UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    slug            VARCHAR(100) NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_published    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(topic_id, slug)
);

CREATE TABLE subtopic_translations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subtopic_id     UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
    locale          VARCHAR(5) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    UNIQUE(subtopic_id, locale)
);

-- Level 3: Lessons (the leaf level — each has presentation + working page)
CREATE TABLE lessons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subtopic_id     UUID NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
    slug            VARCHAR(100) NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_published    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(subtopic_id, slug)
);

CREATE TABLE lesson_translations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    locale          VARCHAR(5) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    UNIQUE(lesson_id, locale)
);

-- Presentations: HTML files imported by admins
CREATE TABLE presentations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    locale          VARCHAR(5) NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    file_path       VARCHAR(500) NOT NULL,   -- relative path under /media/content/
    file_hash       VARCHAR(64),             -- SHA-256 for deduplication
    original_filename VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(lesson_id, locale, version)
);

-- Working pages: exercise/workspace HTML paired with a presentation
CREATE TABLE working_pages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    locale          VARCHAR(5) NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    file_path       VARCHAR(500) NOT NULL,
    file_hash       VARCHAR(64),
    original_filename VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(lesson_id, locale, version)
);

-- GeoGebra interactive activities
CREATE TABLE geogebra_activities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    locale          VARCHAR(5) NOT NULL,
    material_id     VARCHAR(50),            -- GeoGebra material ID (from geogebra.org)
    custom_file_path VARCHAR(500),          -- OR: local .ggb file path
    applet_params   JSONB NOT NULL DEFAULT '{}',  -- width, height, showToolBar, etc.
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(lesson_id, locale, sort_order)
);
```

#### 2.2 Content Storage Strategy

| Content Type | Storage Location | Rationale |
|---|---|---|
| HTML presentations | **Filesystem** (`/media/content/presentations/{topic_slug}/{subtopic_slug}/{lesson_slug}/{locale}/v{N}/`) | HTML files may contain relative asset references (images, CSS, JS). Filesystem preserves directory structure and allows nginx to serve them directly without hitting the Python backend. |
| Working pages | **Filesystem** (`/media/content/working-pages/{topic_slug}/{subtopic_slug}/{lesson_slug}/{locale}/v{N}/`) | Same rationale as presentations. |
| GeoGebra configs | **Database (JSONB)** | Configuration is structured data (material IDs, applet parameters). Small, queryable, no file structure needed. |
| GeoGebra .ggb files | **Filesystem** (`/media/content/geogebra/{id}/`) | Binary files, served directly by nginx. |

**Why filesystem over object storage (S3)?** This is a POC. Local filesystem with nginx serving `/media/*` is the simplest approach. The file_path column in the DB makes migration to S3 a one-variable change later — swap the base URL from `/media/` to `https://cdn.example.com/`.

#### 2.3 Content Versioning

Simple **integer versioning** per content item per locale:
- Each upload creates a new version row (version N+1)
- Only one version is `is_active = true` at a time per (lesson, locale)
- Old versions are retained for rollback (admin can reactivate any version)
- No complex branching or draft/publish workflow in the POC — `is_published` on the lesson controls visibility

#### 2.4 Multi-Language Content Structure

Content is **locale-keyed at the row level**, not the column level:

```
Topic "Algebra" (1 of 9 main topics)
├── Subtopic "Quadratic Equations"
│   ├── Lesson "Factoring Quadratics"
│   │   ├── presentation (he) → /media/content/presentations/algebra/quadratic-equations/factoring/he/v1/index.html
│   │   ├── presentation (en) → /media/content/presentations/algebra/quadratic-equations/factoring/en/v1/index.html
│   │   ├── working_page (he) → /media/content/working-pages/algebra/quadratic-equations/factoring/he/v1/index.html
│   │   ├── working_page (en) → (not yet uploaded)
│   │   └── geogebra (he)     → material_id: "abc123", params: {showToolBar: false}
│   └── Lesson "Completing the Square"
│       ├── presentation (he) → ...
│       └── working_page (he) → ...
├── Subtopic "Linear Equations"
│   └── Lesson "Solving for X"
│       └── ...
```

This means:
- Content can exist in some languages but not others (progressive translation)
- The API returns available locales per lesson so the UI can show/hide language switches
- Each locale's content is fully independent — a Hebrew presentation is NOT a translation of the English one; they may be completely different files

### 3. i18n Architecture

#### 3.1 Two Separate i18n Domains

| Domain | What | Mechanism | Example |
|--------|------|-----------|---------|
| **UI i18n** | Navigation, buttons, labels, error messages | `react-i18next` with JSON translation files bundled in the frontend | "Next Lesson", "Back to Course", "Loading…" |
| **Content i18n** | Lessons, presentations, working pages, GeoGebra | Database locale column + locale-specific files on disk | The actual HTML presentation content |

These two domains are **strictly separated**. UI i18n is a frontend concern. Content i18n is a backend/data concern. They share the same locale code (`he`, `en`, `ar`) but are managed independently.

#### 3.2 UI i18n Stack

```
frontend/
└── src/
    └── i18n/
        ├── config.ts          # i18next initialization
        └── locales/
            ├── he/
            │   └── common.json    # Hebrew UI strings (default)
            │   └── admin.json     # Admin panel strings
            ├── en/
            │   └── common.json
            │   └── admin.json
            └── ar/
                └── common.json
                └── admin.json
```

**Configuration principles:**
- Default language: `he` (Hebrew)
- Fallback chain: current locale → `he` → key name
- Namespace separation: `common` (student UI), `admin` (CMS dashboard)
- Direction is derived from locale: `he` → RTL, `en` → LTR, `ar` → RTL

#### 3.3 RTL/LTR Implementation

```tsx
// Root-level direction provider
const LOCALE_DIRECTION: Record<string, 'rtl' | 'ltr'> = {
  he: 'rtl',
  en: 'ltr',
  ar: 'rtl',
};

// Applied at <html> element level:
// <html lang={locale} dir={LOCALE_DIRECTION[locale]}>
```

**CSS strategy:**
- Use CSS logical properties throughout: `margin-inline-start` instead of `margin-left`, `padding-inline-end` instead of `padding-right`
- The `[dir="rtl"]` and `[dir="ltr"]` selectors handle any edge cases
- Component library (if adopted) must support RTL natively — recommend **MUI** (excellent RTL support) or keep it minimal with custom CSS

#### 3.4 Content Language Switching

```
GET /api/v1/lessons/{lesson_id}?locale=he

Response:
{
  "id": "uuid",
  "title": "פירוק משוואות ריבועיות",     // from lesson_translations
  "subtopic": "משוואות ריבועיות",          // parent subtopic
  "topic": "אלגברה",                       // parent topic
  "available_locales": ["he", "en"],       // which languages have content
  "presentation": {
    "url": "/media/content/presentations/algebra/quadratic-equations/factoring/he/v1/index.html",
    "version": 1
  },
  "working_page": {
    "url": "/media/content/working-pages/algebra/quadratic/he/v1/index.html",
    "version": 1
  },
  "geogebra_activities": [...]
}
```

The frontend requests content for the current UI locale. If content isn't available in that locale, the API returns `null` for that content type and the UI shows a "not available in this language" message with links to available locales.

### 4. Frontend Architecture

#### 4.1 Routing Structure

```
/                                         → Home (9 main math topics grid)
/:topicSlug                               → Topic page (list of sub-topics)
/:topicSlug/:subtopicSlug                 → Sub-topic page (list of lessons)
/:topicSlug/:subtopicSlug/:lessonSlug     → Lesson viewer (tabbed: presentation | working page | interactive)
/:topicSlug/:subtopicSlug/:lessonSlug/present  → Presentation (full view)
/:topicSlug/:subtopicSlug/:lessonSlug/work     → Working page (full view)
/:topicSlug/:subtopicSlug/:lessonSlug/interact → GeoGebra interactive (full view)

/admin                                    → CMS Dashboard (protected)
/admin/topics                             → Manage 9 main topics
/admin/topics/:id/subtopics               → Manage sub-topics
/admin/topics/:id/subtopics/:id/lessons   → Manage lessons
/admin/topics/:id/subtopics/:id/lessons/:id → Edit lesson, upload content
/admin/login                              → Simple admin login
```

#### 4.2 Frontend Project Structure

```
frontend/
├── public/
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Root: Router + i18n + direction provider
│   ├── api/                      # API client (axios/fetch wrapper)
│   │   ├── client.ts
│   │   ├── topics.ts
│   │   ├── subtopics.ts
│   │   ├── lessons.ts
│   │   └── admin.ts
│   ├── components/               # Shared UI components
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # Main layout (header, nav, content area)
│   │   │   ├── Header.tsx
│   │   │   └── LanguageSwitcher.tsx
│   │   ├── content/
│   │   │   ├── PresentationViewer.tsx    # Renders HTML presentations
│   │   │   ├── WorkingPageViewer.tsx     # Renders working pages
│   │   │   ├── GeoGebraViewer.tsx        # Embeds GeoGebra applets
│   │   │   └── ContentNotAvailable.tsx   # "Not in this language" fallback
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── pages/                    # Route-level components
│   │   ├── student/
│   │   │   ├── HomePage.tsx             # 9 main topic cards
│   │   │   ├── TopicPage.tsx            # Sub-topics list
│   │   │   ├── SubtopicPage.tsx         # Lessons list
│   │   │   └── LessonPage.tsx           # Presentation + working page + GeoGebra
│   │   └── admin/
│   │       ├── DashboardPage.tsx
│   │       ├── TopicEditorPage.tsx
│   │       ├── SubtopicEditorPage.tsx
│   │       └── LessonEditorPage.tsx
│   ├── hooks/                    # Custom hooks
│   │   ├── useLocale.ts
│   │   ├── useDirection.ts
│   │   ├── useTopicData.ts
│   │   └── useSubtopicData.ts
│   ├── i18n/                     # UI translations (see §3.2)
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts
│   └── utils/
│       └── direction.ts
├── package.json
├── tsconfig.json
└── vite.config.ts                # Vite as build tool
```

#### 4.3 HTML Presentation Rendering

**Decision: Sandboxed `<iframe>`**

```tsx
// PresentationViewer.tsx concept
<iframe
  src={presentationUrl}           // e.g., /media/content/presentations/.../index.html
  sandbox="allow-scripts allow-same-origin"
  title={lessonTitle}
  style={{ width: '100%', height: '100%', border: 'none' }}
/>
```

**Why iframe, not direct injection or Shadow DOM?**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **iframe (sandboxed)** | Full CSS isolation, safe for arbitrary HTML, simple | Cross-frame communication harder, extra HTTP request | ✅ **Chosen** |
| Direct innerHTML injection | Simple, no iframe overhead | CSS conflicts, XSS risk, breaks React reconciliation | ❌ Rejected |
| Shadow DOM | Good CSS isolation | Complex, no iframe security boundary, browser quirks | ❌ Rejected |

The presentations are **externally authored HTML files** — we cannot guarantee they won't have global CSS or scripts. Iframe isolation is the only safe choice.

The iframe loads directly from nginx (`/media/content/...`), not through the API — zero backend load for content serving.

#### 4.4 GeoGebra Integration

```tsx
// GeoGebraViewer.tsx concept
// Uses the GeoGebra Apps API: https://wiki.geogebra.org/en/Reference:GeoGebra_Apps_API

useEffect(() => {
  const applet = new GGBApplet({
    material_id: activity.materialId,    // OR filename for local .ggb
    width: activity.params.width ?? 800,
    height: activity.params.height ?? 600,
    showToolBar: activity.params.showToolBar ?? false,
    showMenuBar: activity.params.showMenuBar ?? false,
    showAlgebraInput: activity.params.showAlgebraInput ?? false,
    language: currentLocale,             // GeoGebra supports he, en, ar
    ...activity.params,                  // Any additional applet params from DB
  }, true);
  applet.inject(containerRef.current);
}, [activity, currentLocale]);
```

**GeoGebra script loading:** Load `https://www.geogebra.org/apps/deployggb.js` via a `<script>` tag. Use a custom hook (`useGeoGebra`) that:
1. Dynamically loads the script if not already present
2. Returns a loading/ready state
3. Provides the `GGBApplet` constructor

### 5. Backend Architecture

#### 5.1 FastAPI Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                   # FastAPI app creation, middleware, startup
│   ├── config.py                 # Settings via pydantic-settings (env vars)
│   ├── database.py               # SQLAlchemy engine & session factory
│   │
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── course.py
│   │   ├── lesson.py
│   │   ├── presentation.py
│   │   ├── working_page.py
│   │   └── geogebra_activity.py
│   │
│   ├── schemas/                  # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── course.py
│   │   ├── lesson.py
│   │   ├── content.py
│   │   └── common.py             # Pagination, error responses
│   │
│   ├── api/                      # Route handlers
│   │   ├── __init__.py
│   │   ├── router.py             # Main router aggregating all sub-routers
│   │   ├── public/               # Student-facing endpoints (no auth)
│   │   │   ├── __init__.py
│   │   │   ├── courses.py        # GET /api/v1/courses, GET /api/v1/courses/{slug}
│   │   │   └── lessons.py        # GET /api/v1/lessons/{id}?locale=he
│   │   └── admin/                # CMS endpoints (auth required)
│   │       ├── __init__.py
│   │       ├── courses.py        # CRUD /api/v1/admin/courses
│   │       ├── lessons.py        # CRUD /api/v1/admin/lessons
│   │       ├── upload.py         # POST /api/v1/admin/upload/presentation
│   │       └── auth.py           # POST /api/v1/admin/login
│   │
│   ├── services/                 # Business logic layer
│   │   ├── __init__.py
│   │   ├── course_service.py
│   │   ├── lesson_service.py
│   │   └── upload_service.py     # File handling, validation, versioning
│   │
│   └── middleware/
│       ├── __init__.py
│       └── auth.py               # Simple token/session auth for admin
│
├── alembic/                      # Database migrations
│   ├── env.py
│   └── versions/
├── alembic.ini
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

#### 5.2 API Design

**Public API (no auth):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/topics?locale=he` | List published topics (9 main topics) |
| GET | `/api/v1/topics/{slug}?locale=he` | Topic detail with sub-topics list |
| GET | `/api/v1/topics/{slug}/subtopics/{slug}?locale=he` | Sub-topic detail with lessons list |
| GET | `/api/v1/lessons/{id}?locale=he` | Lesson detail with content URLs |

**Admin API (auth required):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/login` | Admin login (returns JWT) |
| GET/POST | `/api/v1/admin/topics/{id}/subtopics` | List/create sub-topics |
| PUT/DELETE | `/api/v1/admin/subtopics/{id}` | Update/delete sub-topic |
| GET/POST | `/api/v1/admin/subtopics/{id}/lessons` | List/create lessons |
| PUT/DELETE | `/api/v1/admin/lessons/{id}` | Update/delete lesson |
| POST | `/api/v1/admin/lessons/{id}/presentation` | Upload presentation HTML (multipart) |
| POST | `/api/v1/admin/lessons/{id}/working-page` | Upload working page HTML (multipart) |
| POST/PUT | `/api/v1/admin/lessons/{id}/geogebra` | Create/update GeoGebra activity |
| PUT | `/api/v1/admin/subtopics/{id}/translations` | Upsert sub-topic translations |
| PUT | `/api/v1/admin/lessons/{id}/translations` | Upsert lesson translations |

> **Note:** Main topics (9) are immutable — seeded at deployment, no admin CRUD.
> Only sub-topics and lessons can be created/edited/deleted by admins.

#### 5.3 Admin Authentication

For the POC, use **simple JWT-based authentication**:
- Admin credentials stored in environment variables (single admin) or a small `admins` table
- `POST /api/v1/admin/login` → returns a JWT
- Admin API routes validate the JWT via a FastAPI dependency
- No OAuth, no RBAC, no refresh tokens — this is a POC

#### 5.4 File Upload Flow

```
Admin uploads "lesson3-he.html" for lesson X, locale "he":

1. POST /api/v1/admin/lessons/{id}/presentation
   Form data: file=lesson3-he.html, locale=he

2. Backend:
   a. Validate file (must be .html or .zip)
   b. Compute SHA-256 hash
   c. Determine next version number for (lesson_id, locale)
   d. Save file to: /media/content/presentations/{topic_slug}/{subtopic_slug}/{lesson_slug}/he/v{N}/
      - If .zip: extract contents, expect index.html at root
      - If .html: save as index.html
   e. Insert row into presentations table
   f. Set is_active=false on previous version, is_active=true on new one

3. Response: { id, version, file_path, url }
```

### 6. Monorepo Folder Structure

```
G-mathPOC/
├── .squad/                       # Squad agent configurations
├── docs/
│   ├── adr/                      # Architecture Decision Records
│   └── api/                      # API documentation (auto-generated later)
│
├── frontend/                     # React application
│   ├── public/
│   ├── src/                      # (see §4.2 for internal structure)
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # FastAPI application
│   ├── app/                      # (see §5.1 for internal structure)
│   ├── alembic/
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── Dockerfile
│
├── media/                        # Content file storage (gitignored)
│   └── content/
│       ├── presentations/
│       ├── working-pages/
│       └── geogebra/
│
├── nginx/                        # Nginx configuration
│   └── nginx.conf
│
├── docker-compose.yml            # Local development: frontend + backend + postgres + nginx
├── .env.example                  # Environment variable template
├── .gitignore
└── README.md
```

---

## Consequences

### Positive
- **Single React app** reduces deployment complexity and shares components across student and admin views
- **Filesystem storage + nginx** means zero backend load for serving content — HTML presentations are served as static files
- **Locale-per-row content model** supports progressive translation without schema changes
- **Strict UI/content i18n separation** prevents the common mistake of conflating app translation with content translation
- **Iframe isolation** for HTML presentations provides CSS/JS safety for externally-authored content
- **Simple versioning** (integer + is_active flag) avoids premature complexity while enabling rollback
- **JSONB for GeoGebra params** provides flexibility without schema migrations for new applet parameters

### Negative
- **Single app = larger bundle** — admin code ships to students (mitigated by lazy loading/code splitting on admin routes)
- **Filesystem storage** doesn't scale to multi-server without shared storage (acceptable for POC; migrate to S3 later)
- **Simple JWT auth** has no refresh token or session invalidation (acceptable for POC)
- **No real-time collaboration** — two admins could overwrite each other's uploads (acceptable for POC; add optimistic locking later)

### Risks
- **GeoGebra API stability** — we depend on their CDN-hosted `deployggb.js`. If their API changes, our integration breaks. Mitigation: pin a specific version if they support it; wrap all GeoGebra logic in a single component.
- **HTML presentation quality** — externally authored HTML may have accessibility or RTL issues. Mitigation: provide authoring guidelines; consider a validation step on upload.
- **Content volume** — if hundreds of courses with large HTML files accumulate, filesystem management becomes complex. Mitigation: the file_path abstraction makes S3 migration straightforward.

---

## Appendix A: Technology Justification

| Choice | Alternatives Considered | Why This |
|--------|------------------------|----------|
| **Vite** (frontend build) | Create React App, Next.js | CRA is deprecated. Next.js adds SSR complexity we don't need (no SEO requirement for a learning platform). Vite is fast, simple, TypeScript-native. |
| **FastAPI** (backend) | Django, Flask | FastAPI has native async, auto-generated OpenAPI docs, Pydantic validation. Django is heavier than needed. Flask lacks built-in validation. |
| **SQLAlchemy** (ORM) | Raw SQL, Tortoise ORM | Industry standard for Python, excellent PostgreSQL support, Alembic migrations. |
| **react-i18next** (UI i18n) | FormatJS/react-intl, custom | Most widely adopted, excellent RTL ecosystem, namespace support, lazy loading. |
| **iframe** (HTML rendering) | Shadow DOM, innerHTML | Only approach that provides true CSS/JS isolation for untrusted external HTML. |
| **Local filesystem** (content) | S3, DB blobs | Simplest for POC. Nginx serves directly. Migration path to S3 is clean. |
| **PostgreSQL** (database) | SQLite, MongoDB | Required by product spec. Excellent JSONB support for GeoGebra params. |

## Appendix B: Future Considerations (Not in POC)

These are explicitly **out of scope** but the architecture accommodates them:

1. **Student accounts & progress tracking** — add a `students` table and `lesson_progress` table; no schema redesign needed
2. **S3 migration** — change file_path base URL; add S3 upload to upload_service
3. **Content approval workflow** — add `status` enum (draft/review/published) to content tables
4. **Real-time collaboration** — add WebSocket endpoints for live editing
5. **Analytics** — add anonymous page view tracking (no PII)
6. **Math rendering** — KaTeX/MathJax integration in working pages (orthogonal to architecture)
