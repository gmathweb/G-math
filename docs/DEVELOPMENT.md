# 🛠️ Developer Setup Guide

## Prerequisites

| Tool       | Version  | Notes                        |
|------------|----------|------------------------------|
| Python     | 3.11+    | For the FastAPI backend      |
| Node.js    | 18+      | For the React frontend       |
| PostgreSQL | 16+      | Or use Docker                |
| Docker     | 24+      | Optional — runs everything   |

## Option 1: Docker (Recommended)

The easiest way to run everything:

```bash
# Clone the repo
git clone https://github.com/<your-org>/G-mathPOC.git
cd G-mathPOC

# Copy environment template
cp .env.example backend/.env
# Edit backend/.env — set JWT_SECRET to a strong, unique value

# Start all services
docker-compose up --build
```

This starts:
- **Student Frontend** on http://localhost:5173 (Vite dev server)
- **Admin Frontend** on http://localhost:5174 (Vite dev server)
- **Backend** on http://localhost:8000 (FastAPI + uvicorn)
- **PostgreSQL** on localhost:5432
- **nginx** on http://localhost:8080 (reverse proxy)

### Seed the database

```bash
# Create an admin user
docker-compose exec backend python -m seeds.create_admin

# Load sample data (9 topics, 58 lessons, 3 hero slides)
docker-compose exec backend python -m seeds.run_seed
```

### Stop everything

```bash
docker-compose down          # Stop containers
docker-compose down -v       # Stop + delete database volume
```

---

## Option 2: Manual Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate    # macOS/Linux
# .venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp ../.env.example .env
# Edit .env — at minimum, set:
#   JWT_SECRET=your-strong-secret-here
#   DATABASE_URL=postgresql+asyncpg://gmath:gmath@localhost:5432/gmath

# Run database migrations
alembic upgrade head

# Create admin user
python -m seeds.create_admin

# Seed sample data
python -m seeds.run_seed

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API is now running at http://localhost:8000.

### Student Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The student frontend is now running at http://localhost:5173.

### Admin Frontend

```bash
cd admin-frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The admin frontend is now running at http://localhost:5174. It proxies `/api` requests to the backend (port 8000).

**Tech stack:** React 19 + TypeScript + Tailwind CSS + React Query + react-hook-form.

### Managing the topic catalog

Use **Topics → Subtopics → Lessons** in the admin to create and maintain the
catalog. Topic icons, foreground/background colors and publication status are
saved to the API and used by the student topic cards and switcher. New subtopics
and lessons are published by default; a draft parent topic is not shown publicly.
Lesson forms filter subtopics by the selected topic and clear a stale subtopic
selection when its parent changes, without clearing the lesson name.

Admin API requests use flat translated fields (`name_he`, `name_en`, `name_ar`,
and topic `description_*` fields), not nested `name`/`description` objects.
Editing visible translations preserves the other language values. Admin counts
include drafts, and creating, moving or deleting content refreshes the affected
parent counts.

### Presentation playback and uploads

Install dependencies in **both** frontend directories. The admin preview
reuses `frontend/src/components/content/PresentationViewer.tsx`; its Vite
configuration deduplicates React so the shared viewer uses the admin runtime.
Neither app converts presentations: the backend extracts complete HTML ZIP
exports under `MEDIA_ROOT/.presentations/<lesson_id>/<content_file_id>/web/` and keeps the
original archive beside `web/`.

The nginx configuration denies direct access to `.presentations` directories.
Keep that rule (or an equivalent denial in another static server): HTML bundles
and original ZIPs must not bypass the controlled API response policy.

During development, presentation assets load directly from the configured
backend, bypassing Vite's classic-script cross-origin restrictions for opaque
sandboxed iframes. `VITE_PROXY_TARGET` defaults to `http://localhost:8000` in
both apps and is also the default development presentation origin.

For another backend or content origin:

```env
VITE_PROXY_TARGET=http://localhost:8000
VITE_PRESENTATION_ORIGIN=http://localhost:8000
```

Set backend `CORS_ORIGINS` to include the actual student/admin browser origins.
Production builds default to same-origin presentation URLs, handled by the
existing nginx `/api/` proxy. A separately hosted content backend can be selected
with `VITE_PRESENTATION_ORIGIN` at build time; include both app origins in
`CORS_ORIGINS`. Do not remove the iframe or response sandbox to work around
legacy-export compatibility problems.

HTML presentations always use the opaque script-only sandbox. PDFs use the
browser's native PDF viewer without those sandbox flags, which otherwise block
the built-in viewer; their response is still typed `application/pdf` with
`nosniff`. PPTX files are opened/downloaded, not rendered as HTML.

In the admin UI, **Lessons → Presentations** fixes the lesson association and
accepts a name plus ZIP. **Files → Upload** requires selecting a lesson.
No database migration is required; this uses the existing `ContentFile` model.

The lesson route uses the standard AppShell header/footer and normal document
flow around a bounded embedded player. Shared player CSS places the stage and
optional physical-right presentation list above a bottom toolbar. The list uses
named buttons with decorative deck icons, not a select or numbered page list;
transport controls show real previous/next availability and a compact counter.
The toolbar has a single tab stop and ArrowLeft/Right/Home/End navigation; media
transport order remains left-to-right while presentation names follow their text
direction.

Full page is an explicit CSS-expanded browser-window mode, not a call to
requestFullscreen: only this mode hides background site chrome and locks body
scroll. Disclosure and full-page entry/exit preserve the iframe and current page;
selecting another presentation replaces only the iframe. Admin preview opts into
the modal's fitted height and shares these controls, while upload/manage mode
keeps its existing layout.

`presentation_player.py` detects compatible iSpring bootstrap HTML and injects
`presentation-player.js` into the streamed response, leaving stored content
unchanged. The frame uses the SDK's `view().playbackController()` and
`presentation().slides()` APIs. Parent messages are authenticated to the active
iframe window, its opaque `null` origin and a per-source/retry session ID. The
frame accepts messages only from its parent and binds the parent's concrete
HTTP(S) origin. Do not add `allow-same-origin` or access the iframe DOM from the
app. Unsupported exports and PDFs use native navigation, not synthetic pages.

Focused protocol/adapter checks require Node 24:

```bash
node --test frontend/tests/playerProtocol.test.ts backend/tests/presentation-player.test.cjs
```

### Available frontend scripts

These scripts apply to both `frontend/` and `admin-frontend/`:

| Script          | Command            | Description                |
|-----------------|--------------------|----------------------------|
| `npm run dev`   | `vite`             | Start dev server           |
| `npm run build` | `tsc -b && vite build` | Type-check + production build |
| `npm run lint`  | `eslint .`         | Run ESLint                 |
| `npm run preview` | `vite preview`   | Preview production build   |

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database (required)
DATABASE_URL=postgresql+asyncpg://gmath:gmath@localhost:5432/gmath

# JWT Auth (required — MUST be a strong unique secret)
JWT_SECRET=your-strong-secret-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Media storage
MEDIA_ROOT=/media/content

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000

# Environment
ENVIRONMENT=development
```

Frontend environment (in `frontend/.env` or docker-compose):
```env
VITE_API_URL=http://localhost:8080/api
```

### Variable Reference

| Variable                     | Required | Default                                          | Description                        |
|------------------------------|----------|--------------------------------------------------|------------------------------------|
| `DATABASE_URL`               | Yes      | `postgresql+asyncpg://gmath:gmath@localhost:5432/gmath` | Async SQLAlchemy connection string |
| `JWT_SECRET`                 | Yes      | —                                                | Signing key for JWT tokens. Weak defaults are rejected. |
| `JWT_ALGORITHM`              | No       | `HS256`                                          | JWT signing algorithm              |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| No       | `30`                                             | Token TTL in minutes               |
| `MEDIA_ROOT`                 | No       | `/media/content`                                 | Path for uploaded files            |
| `CORS_ORIGINS`               | No       | `http://localhost:5173,http://localhost:5174,http://localhost:3000` | Allowed CORS origins               |
| `ENVIRONMENT`                | No       | `development`                                    | `development` or `production`      |
| `VITE_API_URL`               | No       | —                                                | Frontend API base URL              |

> ⚠️ **JWT_SECRET** — Known weak defaults like `"change-me-in-production"`, `"dev-secret-change-me"`, `"secret"`, `"changeme"` are **rejected** at startup. Use a strong, random secret.

---

## Database Management

### Alembic Migrations

```bash
cd backend

# Apply all pending migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "add favorites table"

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# View current migration
alembic current
```

### Creating an Admin User

```bash
cd backend
python -m seeds.create_admin
```

Environment variables for admin creation:
- `ADMIN_EMAIL` — default: `admin@g-math.co.il`
- `ADMIN_PASSWORD` — prompted securely if not set

### Running Seed Data

```bash
cd backend
python -m seeds.run_seed
```

This creates:
- 9 math topics (Algebra, Trigonometry, Calculus, etc.)
- ~20 subtopics
- ~58 lessons
- 3 hero slides
- All with Hebrew, English, and Arabic translations

The seed script is idempotent — it skips if data already exists.

---

## Project Architecture

```
backend/app/
├── api/
│   ├── admin/          # Protected CRUD endpoints
│   │   ├── topics.py
│   │   ├── subtopics.py
│   │   ├── lessons.py
│   │   ├── hero.py
│   │   ├── users.py
│   │   └── files.py
│   ├── public/         # Read-only public endpoints
│   │   ├── auth.py     # Login + /me
│   │   ├── topics.py   # List + detail with locale
│   │   ├── lessons.py  # Lesson detail with files
│   │   └── hero.py     # Active hero slides
│   └── deps.py         # get_current_user, require_admin
├── models/             # SQLAlchemy ORM models
│   ├── base.py         # TimestampMixin, BaseModel (UUID PK)
│   ├── user.py         # User (admin/editor roles)
│   ├── topic.py        # Topic (multilingual, sorted)
│   ├── subtopic.py     # Subtopic → Topic
│   ├── lesson.py       # Lesson → Subtopic
│   ├── hero.py         # HeroSlide (homepage carousel)
│   ├── content.py      # ContentFile → Lesson
│   └── site_config.py  # Key-value site settings
├── schemas/            # Pydantic request/response schemas
├── services/           # Business logic (auth, hashing)
├── middleware/          # Custom middleware
├── config.py           # Settings from env vars
├── database.py         # Async engine + session factory
├── main.py             # FastAPI app factory
├── rate_limit.py       # SlowAPI rate limiting (5/min on login)
├── logging_config.py   # JSON structured logging + request ID
└── utils.py            # Shared utilities
```

### Data Model

```
Topic (1) ──→ (N) Subtopic (1) ──→ (N) Lesson (1) ──→ (N) ContentFile
                                                              ↑
                                                   file_type: presentation |
                                                              worksheet |
                                                              geogebra |
                                                              video
```

All content models support three languages: Hebrew (`_he`), English (`_en`), Arabic (`_ar`).

---

## Common Development Tasks

### Adding a new model

1. Create `backend/app/models/new_model.py`
2. Import it in `backend/app/models/__init__.py`
3. Create schemas in `backend/app/schemas/`
4. Run `alembic revision --autogenerate -m "add new_model"`
5. Apply with `alembic upgrade head`

### Adding a new endpoint

1. Create route file in `backend/app/api/admin/` or `backend/app/api/public/`
2. Register the router in `backend/app/main.py`
3. Add tests in `backend/tests/test_new_feature.py`

### Adding a new frontend page

1. For student pages: create component in `frontend/src/pages/`
2. For admin pages: create component in `admin-frontend/src/pages/`
3. Add route in the respective `App.tsx`
4. Add API client function in the respective `api/` directory

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `JWT_SECRET` validation error at startup | Set a strong, unique secret in `.env` |
| Database connection refused | Ensure PostgreSQL is running on port 5432 |
| CORS errors in browser | Check `CORS_ORIGINS` includes your frontend URLs (5173 and 5174) |
| Import errors in tests | Run tests from `backend/` directory: `cd backend && python -m pytest` |
| Alembic can't find models | Ensure new models are imported in `models/__init__.py` |
