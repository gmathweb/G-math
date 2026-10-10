# G-math 🧮

**G-math** is a multilingual math learning platform for Israeli high school students. Built with FastAPI + React, it provides structured math content (topics → subtopics → lessons) with full Hebrew, English, and Arabic support. An admin CMS lets educators manage all content through a web interface.

## Tech Stack

| Layer            | Technology                                              |
|------------------|---------------------------------------------------------|
| Student Frontend | React 19, TypeScript, React Router 7, i18next           |
| Admin Frontend   | React 19, TypeScript, Tailwind CSS, React Query, react-hook-form |
| Backend          | Python 3.11+, FastAPI, SQLAlchemy 2 (async)             |
| Database         | PostgreSQL 16 (asyncpg)                                 |
| Auth             | JWT (python-jose), bcrypt (passlib)                     |
| Infrastructure   | Docker Compose, nginx, Vite                             |

## Quick Start

```bash
git clone https://github.com/<your-org>/G-mathPOC.git
cd G-mathPOC
cp .env.example backend/.env

# Edit backend/.env — set a strong JWT_SECRET
docker-compose up --build
```

| Service          | URL                          |
|------------------|------------------------------|
| Student Frontend | http://localhost:5173        |
| Admin Frontend   | http://localhost:5174        |
| API (nginx)      | http://localhost:8080/api    |
| Backend          | http://localhost:8000        |
| Postgres         | localhost:5432               |

### Seed data & admin user

```bash
# In a second terminal:
docker-compose exec backend python -m seeds.create_admin
docker-compose exec backend python -m seeds.run_seed
```

### Deploying / upgrading a database

Topics, subtopics, lessons, hero slides and the home-page texts (trust cards, About section) are
all edited in the admin and stored in Postgres, so a deployed site keeps the admin's changes.

- **Fresh database:** `alembic upgrade head`, then `python -m seeds.run_seed`.
- **Database originally created by `run_seed`** (no Alembic history): run
  `alembic stamp 001_initial && alembic upgrade head` once, then the seed as usual.
- The seed is safe to re-run: it only adds missing rows/settings and **never overwrites** admin
  edits. One exception: subtopics whose `icon` is empty get the default glyph again on each seed run
  (the student site would show a positional glyph for them anyway).
- Bundled lesson presentations (HTML/iSpring ZIP exports in `backend/seeds/presentations/`, listed
  in `LESSON_PRESENTATIONS` in `seeds/seed_data.py`) are attached to their lesson once; a
  `seed.presentation.<zip>` site-config key records it, so renaming or deleting the presentation in
  the admin sticks across seed runs.
- **Never run `docker compose down -v` on a deployed database** — `-v` deletes the Postgres volume
  and every admin edit with it.

## Manual Setup (without Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Create .env with required variables (see Environment Variables below)
alembic upgrade head
python -m seeds.create_admin
python -m seeds.run_seed
uvicorn app.main:app --reload --port 8000
```

### Student Frontend

```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

### Admin Frontend

```bash
cd admin-frontend
npm install
npm run dev          # → http://localhost:5174
```

## Environment Variables

| Variable                     | Required | Default                                          | Description                        |
|------------------------------|----------|--------------------------------------------------|------------------------------------|
| `DATABASE_URL`               | Yes      | `postgresql+asyncpg://gmath:gmath@localhost:5432/gmath` | Async SQLAlchemy connection string |
| `JWT_SECRET`                 | Yes      | —                                                | Must be a strong, unique secret    |
| `JWT_ALGORITHM`              | No       | `HS256`                                          | JWT signing algorithm              |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| No       | `30`                                             | Token expiration in minutes        |
| `MEDIA_ROOT`                 | No       | `/media/content`                                 | File upload storage path           |
| `CORS_ORIGINS`               | No       | `http://localhost:5173,http://localhost:5174,http://localhost:3000` | Comma-separated allowed origins    |
| `ENVIRONMENT`                | No       | `development`                                    | `development` or `production`      |
| `VITE_API_URL`               | No       | —                                                | Frontend API base URL              |

## API Overview

All endpoints are under `/api/v1/`. See [docs/API.md](docs/API.md) for the full reference.

### Public Endpoints (🔓)

| Method | Path                            | Description              |
|--------|---------------------------------|--------------------------|
| POST   | `/api/v1/auth/login`            | Login, get JWT token     |
| GET    | `/api/v1/auth/me`               | Current user info        |
| GET    | `/api/v1/topics`                | List published topics    |
| GET    | `/api/v1/topics/{slug}`         | Topic detail + subtopics |
| GET    | `/api/v1/lessons/{slug}`        | Lesson detail + files    |
| GET    | `/api/v1/hero-slides`           | Active hero slides       |
| GET    | `/api/v1/health`                | Health check             |

### Admin Endpoints (🔐 JWT required)

| Method | Path                                          | Description               |
|--------|-----------------------------------------------|---------------------------|
| GET    | `/api/v1/admin/topics`                        | List all topics           |
| POST   | `/api/v1/admin/topics`                        | Create topic              |
| PUT    | `/api/v1/admin/topics/{id}`                   | Update topic              |
| DELETE | `/api/v1/admin/topics/{id}`                   | Delete topic              |
| GET    | `/api/v1/admin/topics/{id}/subtopics`         | List subtopics            |
| POST   | `/api/v1/admin/subtopics`                     | Create subtopic           |
| PUT    | `/api/v1/admin/subtopics/{id}`                | Update subtopic           |
| DELETE | `/api/v1/admin/subtopics/{id}`                | Delete subtopic           |
| GET    | `/api/v1/admin/subtopics/{id}/lessons`        | List lessons              |
| POST   | `/api/v1/admin/lessons`                       | Create lesson             |
| PUT    | `/api/v1/admin/lessons/{id}`                  | Update lesson             |
| DELETE | `/api/v1/admin/lessons/{id}`                  | Delete lesson             |
| GET    | `/api/v1/admin/lessons`                       | List all lessons (filterable) |
| GET    | `/api/v1/admin/hero-slides`                   | List all hero slides      |
| POST   | `/api/v1/admin/hero-slides`                   | Create hero slide         |
| PUT    | `/api/v1/admin/hero-slides/reorder`           | Reorder slides            |
| PUT    | `/api/v1/admin/hero-slides/{id}`              | Update hero slide         |
| DELETE | `/api/v1/admin/hero-slides/{id}`              | Delete hero slide         |
| GET    | `/api/v1/admin/users`                         | List admin users          |
| POST   | `/api/v1/admin/users`                         | Create admin user         |
| POST   | `/api/v1/admin/files/upload`                  | Upload content file       |
| GET    | `/api/v1/admin/files`                         | List all files            |
| GET    | `/api/v1/admin/files/lesson/{id}`             | Files for a lesson        |
| GET    | `/api/v1/admin/files/{id}/download`           | Download file             |
| DELETE | `/api/v1/admin/files/{id}`                    | Delete file               |
| GET    | `/api/v1/admin/settings`                      | Get site settings         |
| PUT    | `/api/v1/admin/settings`                      | Update site settings      |
| GET    | `/api/v1/admin/stats`                         | Get aggregate stats       |

## Project Structure

```
G-mathPOC/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/          # CRUD endpoints (topics, subtopics, lessons, hero, users, files, settings, stats)
│   │   │   ├── public/         # Read-only endpoints (auth, topics, lessons, hero)
│   │   │   └── deps.py         # Auth dependencies (get_current_user, require_admin)
│   │   ├── models/             # SQLAlchemy models (User, Topic, Subtopic, Lesson, HeroSlide, ContentFile)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic (auth, etc.)
│   │   ├── middleware/         # Custom middleware
│   │   ├── config.py           # Settings (env vars)
│   │   ├── database.py         # Async engine + session
│   │   ├── main.py             # FastAPI app factory
│   │   ├── rate_limit.py       # SlowAPI rate limiting
│   │   └── logging_config.py   # Structured JSON logging
│   ├── alembic/                # Database migrations
│   ├── seeds/                  # Seed scripts (create_admin, run_seed)
│   ├── tests/                  # pytest async tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # Student-facing frontend (port 5173)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/        # HomePage, TopicPage, SubtopicPage, LessonPage
│   │   │   └── admin/          # (legacy) LoginPage, DashboardPage
│   │   ├── components/         # Shared UI components
│   │   ├── hooks/              # useAuth, useDirection, etc.
│   │   ├── api/                # API client functions
│   │   ├── i18n/               # i18next translations (he, en, ar)
│   │   └── App.tsx             # Route definitions
│   └── package.json
├── admin-frontend/             # Admin CMS frontend (port 5174)
│   ├── src/
│   │   ├── pages/              # Admin pages (Dashboard, Topics, Subtopics, Lessons, Hero, Settings)
│   │   ├── components/         # Admin UI components (forms, tables, cascading selects)
│   │   ├── hooks/              # useAuth, React Query hooks
│   │   ├── api/                # API client (Axios, admin endpoints)
│   │   └── App.tsx             # Route definitions
│   └── package.json
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── media/                      # Uploaded content files
├── docker-compose.yml          # All services (frontend, admin-frontend, backend, db, nginx)
├── .env.example                # Environment template
└── docs/                       # Project documentation
    ├── AGENTS.md               # How to work with the AI squad
    ├── API.md                  # Full API reference
    ├── DEVELOPMENT.md          # Developer setup guide
    └── TESTING.md              # Testing guide
```

## The Agent Squad

This project is built by the **Fellowship of Learning** — an AI agent squad:

| Agent | Role | What They Do |
|-------|------|-------------|
| 🧙‍♂️ **Gandalf** | Project Manager | Breaks features into missions, dispatches developers, tracks progress |
| 🛡️ **Elrond** | Tech Lead / Reviewer | Reviews architecture, security, code quality |
| 🌟 **Galadriel** | UX Designer | Design systems, prototypes, RTL layouts, accessibility |
| 🌱 **Samwise** | DevOps (future) | Monitoring, deployment, CI/CD |

Talk to them with `@Agent` commands. See [docs/AGENTS.md](docs/AGENTS.md) for the full guide.

## Languages

- 🇮🇱 **Hebrew** (primary) — RTL
- 🇬🇧 **English** — LTR
- 🇸🇦 **Arabic** (planned) — RTL

## Lesson presentations

In the admin app, open **Lessons → Presentations** beside the target lesson.
Enter the presentation name and select the complete **HTML export ZIP** (such
as an iSpring Web export). Do not unzip it or rename its internal files.
Repeat to attach multiple presentations to the same lesson. The manager
supports preview, rename, ordering, removal and download of the original ZIP.
The **Files** page also accepts uploads, with a required lesson selection.

Lessons use the website's standard header and footer. The embedded player has
bottom previous/next controls and a compact current/total page counter for
compatible iSpring exports. The presentation-list icon opens a collapsible
right-hand list of named presentations with deck icons and an active-selection
indicator; lesson resources remain available there. There is no numbered page
list. Other formats retain their native controls without invented page counts.

The **Full page** icon fills the browser window with the same player, hiding
the site's header/footer without hiding browser tabs or restarting the
presentation. Exit restores the normal lesson view. Admin previews use the
same bottom controls and presentation list; upload and management workflows
remain unchanged.

ZIPs may contain `index.html` at the root or inside one wrapper folder. Limits:
50 MiB uploaded, 200 MiB extracted, 2,000 archive entries. The backend validates
archives and serves their HTML and assets with an isolated content policy.
Legacy PDF, HTML, PPTX, GeoGebra and video uploads remain accepted; PPTX requires
opening/downloading rather than browser playback.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/AGENTS.md](docs/AGENTS.md) | How to work with the AI agent squad |
| [docs/API.md](docs/API.md) | Full REST API reference |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Developer setup guide |
| [docs/TESTING.md](docs/TESTING.md) | Running and writing tests |

## License

TBD
