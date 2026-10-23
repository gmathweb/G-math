# Admin Topic Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One admin-only endpoint and an admin UI page that import a topic's subtopics and lessons from a JSON file, with dry-run preview and replace semantics.

**Architecture:** A service module (`app/services/topic_import.py`) holds the import logic and is called by a thin router (`app/api/admin/import_topic.py`). Dry run executes the same logic then rolls back. The admin frontend gets an Import page that calls the endpoint twice (dry run, then apply).

**Tech Stack:** FastAPI, async SQLAlchemy 2, Pydantic v2, pytest (SQLite), React + Vite + TanStack Query (admin-frontend).

**Spec:** `docs/superpowers/specs/2026-10-23-admin-topic-import-design.md`

## Global Constraints

- Endpoint: `POST /api/v1/admin/import/topic?dry_run=true|false`, default `dry_run=true`, guarded by `require_admin`.
- Topic identified by `topic_slug`; unknown topic → 404.
- `sort_order` = array index. Missing slugs: subtopic `slugify(name_en)` prefixed `<topic_slug>--`; lesson prefixed `<subtopic_slug>--`.
- Names (`name_he`, `name_en`, `name_ar`) non-empty, ≤ 200 chars; `icon` ≤ 20 chars; ≤ 100 subtopics, ≤ 500 lessons.
- Replace semantics: match by slug; matched rows updated in place (content files kept); unmatched existing rows of that topic deleted (their content files cascade). All in one transaction.
- Slug already used by rows of a different topic → 409. Duplicate slug inside the file → 422.
- Presentations/files are out of scope.
- Response shape: `{dry_run, applied, topic_slug, created:{subtopics,lessons}, updated:{subtopics,lessons}, deleted:{subtopics,lessons,content_files}}`.

## Review Focus

- Re-importing the same file twice: second run reports 0 created/0 deleted, all updated (idempotent).
- Lesson moved to another subtopic in the file: row kept, files kept, `subtopic_id` changed.
- Dry run: DB state identical afterward (counts exact).
- Same English name for two subtopics/lessons with no slug: generated slugs collide → 422, not a 500.
- Hebrew/Arabic-only names with no English slug source: `name_en` is required, so slug always derivable.
- Non-admin token → 403; no token → 401.

---

### Task 1: Schemas and import service

**Files:**
- Create: `backend/app/schemas/topic_import.py`, `backend/app/services/topic_import.py`
- Test: `backend/tests/test_topic_import_service.py`

**Interfaces:**
- Produces (schemas): `LessonImport(slug: str|None, name_he, name_en, name_ar)`, `SubtopicImport(slug: str|None, name_he, name_en, name_ar, icon: str = "", lessons: list[LessonImport] = [])`, `TopicImportRequest(topic_slug: str, subtopics: list[SubtopicImport])`, `ImportCounts`, `TopicImportResult` matching the response shape above. Pydantic validators enforce the length/limit constraints.
- Produces (service): `class ImportConflict(Exception)` (message = detail), `class ImportValidationError(Exception)`, `class TopicNotFound(Exception)`, `async def import_topic(db: AsyncSession, req: TopicImportRequest, *, dry_run: bool) -> TopicImportResult`. Commits when `dry_run=False`, rolls back when `True`.

- [ ] **Step 1: Write failing service tests** using `db_session`, a helper that creates a `Topic` (slug `trigonometry`) and tests named: `test_creates_subtopics_and_lessons_with_generated_slugs` (asserts slugs `trigonometry--law-of-sines`, `trigonometry--law-of-sines--introduction`, sort_order by index), `test_second_import_is_idempotent` (created 0, deleted 0, updated n), `test_removed_lesson_is_deleted_with_its_content_files` (assert `deleted.content_files == 1`), `test_kept_lesson_keeps_content_files`, `test_lesson_moved_between_subtopics_keeps_row`, `test_dry_run_leaves_db_unchanged_but_reports_counts`, `test_unknown_topic_raises_topic_not_found`, `test_duplicate_generated_slug_raises_validation_error`, `test_slug_owned_by_other_topic_raises_conflict`.
- [ ] **Step 2: Run** `cd backend && pytest tests/test_topic_import_service.py -v` → FAIL (module missing).
- [ ] **Step 3: Implement schemas** with `Field(min_length=1, max_length=200)` for names, `max_length=20` for icon, `max_length=100`/`500` list limits via validators (lesson total across subtopics).
- [ ] **Step 4: Implement `import_topic`**: load topic by slug with `selectinload(Topic.subtopics).selectinload(Subtopic.lessons).selectinload(Lesson.content_files)`; compute target slugs (using `app.utils.slugify`); detect in-file duplicates; query slugs of subtopics/lessons belonging to other topics for conflicts; upsert matched rows, create new ones, `await db.delete(obj)` for unmatched (ORM cascade deletes content files — count them first); lessons are looked up across the whole topic so a moved lesson is re-parented; `flush()`; build result; `commit()` or `rollback()`.
- [ ] **Step 5: Run** the same pytest command → PASS.
- [ ] **Step 6: Commit** `feat(backend): topic import service and schemas`.

### Task 2: Admin endpoint

**Files:**
- Create: `backend/app/api/admin/import_topic.py`
- Modify: `backend/app/main.py` (import and `app.include_router(admin_import_router)` next to other admin routers)
- Test: `backend/tests/test_topic_import_api.py`

**Interfaces:**
- Consumes: `import_topic`, `TopicImportRequest`, `TopicImportResult`, exceptions from Task 1; `require_admin`, `get_db`.
- Produces: `POST /api/v1/admin/import/topic` returning `TopicImportResult`; maps `TopicNotFound`→404, `ImportConflict`→409, `ImportValidationError`→422.

- [ ] **Step 1: Write failing API tests** (use `async_client`, `admin_token`): `test_requires_auth` (401), `test_non_admin_forbidden` (403, create a non-admin user token), `test_default_is_dry_run_and_writes_nothing`, `test_apply_creates_rows_visible_via_public_topic_endpoint`, `test_unknown_topic_404`, `test_empty_name_422`, `test_icon_too_long_422`, `test_conflict_409`.
- [ ] **Step 2: Run** `pytest tests/test_topic_import_api.py -v` → FAIL.
- [ ] **Step 3: Implement router** (`prefix="/api/v1/admin/import"`, `tags=["admin-import"]`) and register it.
- [ ] **Step 4: Run** `pytest tests/test_topic_import_api.py tests/test_topic_import_service.py -v` then the full `pytest` → PASS.
- [ ] **Step 5: Commit** `feat(backend): admin topic import endpoint`.

### Task 3: Admin UI Import page

**Files:**
- Create: `admin-frontend/src/api/importTopic.ts`, `admin-frontend/src/pages/ImportPage.tsx`
- Modify: `admin-frontend/src/App.tsx` (route `import`), `admin-frontend/src/layouts/AdminLayout.tsx` (nav item `{ to: '/admin/import', label: 'import', icon: '📥' }`; follow how `label` is resolved there), `admin-frontend/src/types/index.ts` (import types)

**Interfaces:**
- Consumes: endpoint from Task 2 via `api.post<TopicImportResult>('/admin/import/topic?dry_run=...', body)`.
- Produces: `useImportTopic()` mutation hook taking `{ body: TopicImportRequest; dryRun: boolean }`.

- [ ] **Step 1: Implement api hook and types** mirroring the response shape.
- [ ] **Step 2: Implement `ImportPage`**: file input accepting `.json`; parse client-side (show a readable error for invalid JSON); preview table of subtopics → lesson count; "Preview" button calls dry run and shows created/updated/deleted counts, with `deleted.content_files > 0` highlighted as a warning; "Apply import" button (enabled only after a successful preview of the same file) calls with `dryRun=false`, toasts success. Hebrew UI text consistent with other admin pages.
- [ ] **Step 3: Wire route and nav item.**
- [ ] **Step 4: Verify** `cd admin-frontend && npm run build` (includes type-check) → succeeds.
- [ ] **Step 5: Commit** `feat(admin): topic import page`.

### Task 4: Trigonometry sample file and docs

**Files:**
- Create: `backend/seeds/imports/trigonometry.json`
- Modify: `docs/API.md` (new "Topic import" section: login → dry run → apply, curl examples, JSON schema, replace semantics and file-retention note)
- Test: extend `backend/tests/test_topic_import_service.py`

- [ ] **Step 1: Write failing test** `test_trigonometry_sample_file_is_valid`: loads the JSON, validates with `TopicImportRequest`, asserts 10 subtopics, 45 lessons total, `topic_slug == "trigonometry"`, every icon ≤ 20 chars.
- [ ] **Step 2: Run** it → FAIL.
- [ ] **Step 3: Create `trigonometry.json`** from the approved table in the conversation (10 subtopics, 45 lessons, he/en/ar names, icons: 📐 🔺 ⭕ 📈 📏 🟰 ✖️ 🅰️ 📐 🔍 in table order; do not repeat 📐 confusingly — use 📐 for subtopic 1 and 🧭 for subtopic 9; leave slugs unset). Lesson names exactly as listed in the table (Hebrew spacing artifacts fixed).
- [ ] **Step 4: Run** full `pytest` → PASS.
- [ ] **Step 5: Commit** `feat: trigonometry import sample and API docs`.

---

## Self-review notes
- Spec coverage: endpoint/auth (T2), replace + file retention + validation + dry run (T1), UI (T3), sample + docs (T4), tests in each task.
- Type names are consistent: `TopicImportRequest`, `TopicImportResult`, `import_topic`.
- After merge and deploy, applying Trigonometry to production is a manual step by the user (admin password required): upload `trigonometry.json` on the Import page.
