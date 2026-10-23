# Admin topic import: design

## Intent
Let an admin (UI) or an agent upload one JSON file describing a topic's subtopics and lessons, and have the backend write it to the right tables. Motivation: the DB firewall blocks direct seeding from developer machines, and content such as the Trigonometry syllabus (10 subtopics, 45 lessons) should be loadable repeatedly without hand-entering rows.

## Goals
- One admin-only endpoint that imports a single topic's subtopics + lessons (he/en/ar names, subtopic icon, order).
- Same endpoint used by the admin UI ("Import" page) and by agents. Agents obtain a token via the existing `POST /api/v1/auth/login` with the user's email and password.
- Dry-run preview before anything is written.
- Atomic: all-or-nothing in one transaction.

## Non-goals
- Presentations/worksheets/videos (uploaded separately, existing files API).
- Importing topics themselves, hero slides, or site content.
- Excel/CSV input.

## Anti-goals
- Silently destroying uploaded content files on re-import.
- Partial imports that leave a topic half-populated.

## Constraints
- FastAPI + async SQLAlchemy; `lessons.subtopic_id` and `content_files.lesson_id` cascade on delete.
- `slug` is globally unique on subtopics and lessons; `icon` is `String(20)`.
- Auth uses existing `require_admin` (Bearer JWT).

## Approaches considered
- **A. JSON file, one endpoint for UI and agents (chosen by user).**
- B. Excel/CSV: friendlier for editors but error-prone with RTL text and merged cells; harder for agents.
- C. Both: ~2x work, not needed now.

## Design
**Endpoint:** `POST /api/v1/admin/import/topic?dry_run=true|false` (default `true`), body is the JSON below. The topic is identified by `topic_slug` (must exist, else 404).

```json
{
  "topic_slug": "trigonometry",
  "subtopics": [
    {
      "slug": "optional",
      "name_he": "...", "name_en": "...", "name_ar": "...",
      "icon": "📐",
      "lessons": [
        {"slug": "optional", "name_he": "...", "name_en": "...", "name_ar": "..."}
      ]
    }
  ]
}
```
`sort_order` comes from array position. Missing slugs are generated as `<topic>--<english-slug>` for subtopics and `<subtopic-slug>--<english-slug>` for lessons.

**Replace semantics (user request: remove all subtopics/lessons of the topic, then add the data), with one safeguard (my call):** lessons are matched by slug before deletion. A lesson whose slug is present in the new file is updated in place (keeping its content files); likewise subtopics. Subtopics/lessons not in the file are deleted (their files cascade). Net result equals a full replace, without losing files for lessons that remain. Moving a lesson to a different subtopic keeps it, since the slug and row are preserved and `subtopic_id` is updated.

**Validation (422 before any write):** non-empty names in all three languages, `icon` ≤ 20 chars, duplicate slugs within the file, slugs already used by a different topic's rows (409). Limits: ≤ 100 subtopics, ≤ 500 lessons.

**Response:** `{dry_run, topic, created: {subtopics, lessons}, updated: {...}, deleted: {subtopics, lessons, content_files}, applied}`. A dry run performs the same logic in a transaction that is rolled back, so counts are exact.

**Admin UI:** new "Import" page in `admin-frontend`: pick/drop a JSON file, show a parsed preview and the dry-run counts (highlight the number of content files to be deleted), then a confirm button calls with `dry_run=false`. Hebrew/English/Arabic i18n strings like the other pages.

**Agent usage:** documented in `docs/API.md`: login, POST dry run, review, POST with `dry_run=false`. A sample `trigonometry.json` (the approved table) is stored under `backend/seeds/imports/`.

**Testing:** backend pytest cases (SQLite in-memory) for create, replace keeping files, deleting removed lessons' files, dry run rollback, validation errors, auth (401/403). Frontend: type-check/build.

## Left to the builder
Exact module/schema names, slug-generation helper reuse (`app.utils.slugify`), UI component styling following existing admin pages.

## Open follow-up (outside this change)
Applying the Trigonometry data to production happens after deploy, by uploading the JSON through the new page or endpoint (requires the admin password from the user).
