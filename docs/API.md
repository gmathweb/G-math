# 📡 API Reference

**Base URL:** `/api/v1`

All request/response bodies are JSON unless otherwise noted.  
UUIDs are used for all resource IDs.

---

## Authentication

### POST `/api/v1/auth/login`

Login and receive a JWT access token.

- **Auth:** 🔓 Public
- **Rate limit:** 5 requests/minute

**Request:**
```json
{
  "email": "admin@g-math.co.il",
  "password": "your-password"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Errors:**
| Code | Reason |
|------|--------|
| 401  | Invalid email or password |
| 403  | Account is disabled |

---

### GET `/api/v1/auth/me`

Get the current authenticated user.

- **Auth:** 🔐 Bearer token

**Response (200):**
```json
{
  "id": "uuid",
  "email": "admin@g-math.co.il",
  "full_name": "Admin User",
  "role": "admin",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00",
  "updated_at": "2025-01-01T00:00:00"
}
```

**Errors:**
| Code | Reason |
|------|--------|
| 401  | Missing or invalid token |

---

## Health

### GET `/api/v1/health`

Health check with database connectivity.

- **Auth:** 🔓 Public

**Response (200):**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Response (503):**
```json
{
  "status": "unhealthy",
  "database": "error message"
}
```

---

## Public — Topics

### GET `/api/v1/topics`

List all published topics with subtopic/lesson counts.

- **Auth:** 🔓 Public

**Query Parameters:**
| Param    | Type   | Default | Description         |
|----------|--------|---------|---------------------|
| `locale` | string | `"he"`  | `"he"`, `"en"`, or `"ar"` |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "slug": "algebra",
    "icon": "➕",
    "color": "#6366f1",
    "bg_color": "#EEF2FF",
    "name": "אלגברה",
    "description": "משוואות ופונקציות",
    "sort_order": 1,
    "subtopic_count": 4,
    "lesson_count": 11
  }
]
```

---

### GET `/api/v1/topics/{slug}`

Get a topic with its subtopics and lessons.

- **Auth:** 🔓 Public

**Path Parameters:**
| Param  | Type   | Description      |
|--------|--------|------------------|
| `slug` | string | Topic URL slug   |

**Query Parameters:**
| Param    | Type   | Default | Description         |
|----------|--------|---------|---------------------|
| `locale` | string | `"he"`  | `"he"`, `"en"`, or `"ar"` |

**Response (200):**
```json
{
  "id": "uuid",
  "slug": "algebra",
  "icon": "➕",
  "color": "#6366f1",
  "bg_color": "#EEF2FF",
  "name": "אלגברה",
  "description": "משוואות ופונקציות",
  "sort_order": 1,
  "subtopics": [
    {
      "id": "uuid",
      "slug": "linear-equations",
      "name": "משוואות ליניאריות",
      "icon": "=",
      "sort_order": 0,
      "lessons": [
        {
          "id": "uuid",
          "slug": "alg--linear-eq--intro",
          "name": "מבוא למשוואות",
          "sort_order": 0
        }
      ]
    }
  ]
}
```

> Subtopic `icon` is a short glyph (≤ 20 chars, e.g. `"f(x)"`); it may be `""`, in which case the
> student site shows a fallback glyph by position.

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Topic not found |

---

## Public — Lessons

### GET `/api/v1/lessons/{slug}`

Get lesson detail with content files.

- **Auth:** 🔓 Public

**Path Parameters:**
| Param  | Type   | Description       |
|--------|--------|-------------------|
| `slug` | string | Lesson URL slug   |

**Query Parameters:**
| Param    | Type   | Default | Description         |
|----------|--------|---------|---------------------|
| `locale` | string | `"he"`  | `"he"`, `"en"`, or `"ar"` |

**Response (200):**
```json
{
  "id": "uuid",
  "slug": "alg--linear-eq--intro",
  "name": "מבוא למשוואות",
  "sort_order": 0,
  "subtopic_slug": "linear-equations",
  "topic_slug": "algebra",
  "content_files": [
    {
      "id": "uuid",
      "file_type": "presentation",
      "file_url": "/media/content/lessons/uuid/intro.pdf",
      "display_name": "intro.pdf",
      "sort_order": 0
    }
  ]
}
```

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Lesson not found |

---

## Public — Hero Slides

### GET `/api/v1/hero-slides`

List active hero slides for the homepage carousel.

- **Auth:** 🔓 Public

**Query Parameters:**
| Param    | Type   | Default | Description         |
|----------|--------|---------|---------------------|
| `locale` | string | `"he"`  | `"he"`, `"en"`, or `"ar"` |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "כל השיעורים במקום אחד",
    "subtitle": "מתמטיקה לתיכון",
    "button_text": "התחל ללמוד",
    "button_link": "/algebra",
    "sort_order": 0
  }
]
```

---

## Public — Site Content

### GET `/api/v1/site-content`

Admin-editable home-page texts: the three trust cards and the About section.

- **Auth:** 🔓 Public

**Query Parameters:**
| Param    | Type   | Default | Description         |
|----------|--------|---------|---------------------|
| `locale` | string | `"he"`  | `"he"`, `"en"`, or `"ar"` |

**Response (200):**
```json
{
  "trust_cards": [
    { "icon": "🏛️", "text": "האתר מאושר על ידי משרד החינוך" }
  ],
  "about": {
    "title": "G-math הוקמה כדי…",
    "body": "פסקה ראשונה\n\nפסקה שנייה",
    "button_text": "עוד קצת עלינו",
    "button_link": "/about-mathematics"
  }
}
```

> Values come from the `home.*` site settings (see Admin — Settings). A key that was never saved
> uses the built-in default; an empty English/Arabic text falls back to the Hebrew one. `body`
> paragraphs are separated by a blank line.

---

## Admin — Topics

> All admin endpoints require `Authorization: Bearer <token>` with an admin-role user.

### GET `/api/v1/admin/topics`

List all topics (including unpublished). `subtopic_count` and `lesson_count`
include drafts for admin management; the public topic counts include published
content only.

- **Auth:** 🔐 Admin

**Response (200):**
```json
[
  {
    "id": "uuid",
    "slug": "algebra",
    "icon": "➕",
    "color": "#6366f1",
    "bg_color": "#EEF2FF",
    "name_he": "אלגברה",
    "name_en": "Algebra",
    "name_ar": "الجبر",
    "description_he": "...",
    "description_en": "...",
    "description_ar": "...",
    "subtopic_count": 4,
    "lesson_count": 12,
    "sort_order": 1,
    "is_published": true,
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```

---

### POST `/api/v1/admin/topics`

Create a new topic.

- **Auth:** 🔐 Admin

**Request:**
```json
{
  "name_he": "אלגברה",
  "name_en": "Algebra",
  "name_ar": "الجبر",
  "icon": "➕",
  "color": "#6366f1",
  "bg_color": "#EEF2FF",
  "description_he": "משוואות ופונקציות",
  "description_en": "Equations and functions",
  "description_ar": "المعادلات والدوال",
  "sort_order": 1,
  "is_published": true,
  "slug": "algebra"
}
```

> `slug` is optional — auto-generated from `name_he` if omitted.

**Response (201):** Full topic object (same as GET response).

**Errors:**
| Code | Reason |
|------|--------|
| 409  | Slug already exists |

---

### PUT `/api/v1/admin/topics/{topic_id}`

Update a topic. Only provided fields are updated.

- **Auth:** 🔐 Admin

**Request:** Any subset of the create fields.

**Response (200):** Updated topic object.

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Topic not found |
| 409  | Slug conflict |

---

### DELETE `/api/v1/admin/topics/{topic_id}`

Delete a topic and all its subtopics/lessons (cascade).

- **Auth:** 🔐 Admin

**Response:** 204 No Content

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Topic not found |

---

## Admin — Subtopics

### GET `/api/v1/admin/topics/{topic_id}/subtopics`

List subtopics for a topic, with `lesson_count` including draft lessons.

- **Auth:** 🔐 Admin

**Response (200):**
```json
[
  {
    "id": "uuid",
    "topic_id": "uuid",
    "slug": "linear-equations",
    "name_he": "משוואות ליניאריות",
    "name_en": "Linear Equations",
    "name_ar": "المعادلات الخطية",
    "icon": "=",
    "lesson_count": 3,
    "sort_order": 0,
    "is_published": true,
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Parent topic not found |

---

### POST `/api/v1/admin/subtopics`

Create a subtopic.

- **Auth:** 🔐 Admin

**Request:**
```json
{
  "topic_id": "uuid",
  "name_he": "משוואות ליניאריות",
  "name_en": "Linear Equations",
  "name_ar": "المعادلات الخطية",
  "icon": "=",
  "sort_order": 0,
  "is_published": true,
  "slug": "linear-equations"
}
```

> `slug` is optional — auto-generated from `name_he`. `icon` is optional (default `""`, max 20
> chars); on update it may be omitted or set to `""`, but not `null` (422).

**Response (201):** Full subtopic object.

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Parent topic not found |
| 409  | Slug already exists |

---

### PUT `/api/v1/admin/subtopics/{subtopic_id}`

Update a subtopic. Only provided fields are updated.

- **Auth:** 🔐 Admin

**Response (200):** Updated subtopic object.

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Subtopic not found / new parent topic not found |
| 409  | Slug conflict |

---

### DELETE `/api/v1/admin/subtopics/{subtopic_id}`

Delete a subtopic and all its lessons (cascade).

- **Auth:** 🔐 Admin

**Response:** 204 No Content

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Subtopic not found |

---

## Admin — Lessons

### GET `/api/v1/admin/subtopics/{subtopic_id}/lessons`

List lessons for a subtopic.

- **Auth:** 🔐 Admin

**Response (200):**
```json
[
  {
    "id": "uuid",
    "subtopic_id": "uuid",
    "slug": "alg--linear-eq--intro",
    "name_he": "מבוא למשוואות",
    "name_en": "Introduction to Equations",
    "name_ar": "مقدمة في المعادلات",
    "sort_order": 0,
    "is_published": true,
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Parent subtopic not found |

---

### POST `/api/v1/admin/lessons`

Create a lesson.

- **Auth:** 🔐 Admin

**Request:**
```json
{
  "subtopic_id": "uuid",
  "name_he": "מבוא למשוואות",
  "name_en": "Introduction to Equations",
  "name_ar": "مقدمة في المعادلات",
  "sort_order": 0,
  "is_published": true,
  "slug": "alg--linear-eq--intro"
}
```

> `slug` is optional — auto-generated.

**Response (201):** Full lesson object.

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Parent subtopic not found |
| 409  | Slug already exists |

---

### PUT `/api/v1/admin/lessons/{lesson_id}`

Update a lesson. Only provided fields are updated.

- **Auth:** 🔐 Admin

**Response (200):** Updated lesson object.

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Lesson not found / new parent subtopic not found |
| 409  | Slug conflict |

---

### DELETE `/api/v1/admin/lessons/{lesson_id}`

Delete a lesson and all its content files (cascade).

- **Auth:** 🔐 Admin

**Response:** 204 No Content

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Lesson not found |

---

## Admin — Hero Slides

### GET `/api/v1/admin/hero-slides`

List all hero slides (including inactive).

- **Auth:** 🔐 Admin

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title_he": "כל השיעורים במקום אחד",
    "title_en": "All Lessons in One Place",
    "title_ar": "جميع الدروس في مكان واحد",
    "subtitle_he": "...",
    "subtitle_en": "...",
    "subtitle_ar": "...",
    "button_text_he": "התחל ללמוד",
    "button_text_en": "Start Learning",
    "button_text_ar": "ابدأ التعلم",
    "button_link": "/algebra",
    "sort_order": 0,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```

---

### POST `/api/v1/admin/hero-slides`

Create a hero slide.

- **Auth:** 🔐 Admin

**Request:**
```json
{
  "title_he": "כותרת",
  "title_en": "Title",
  "title_ar": "عنوان",
  "subtitle_he": "תת כותרת",
  "subtitle_en": "Subtitle",
  "subtitle_ar": "عنوان فرعي",
  "button_text_he": "לחץ כאן",
  "button_text_en": "Click Here",
  "button_text_ar": "انقر هنا",
  "button_link": "/algebra",
  "sort_order": 0,
  "is_active": true
}
```

**Response (201):** Full hero slide object.

---

### PUT `/api/v1/admin/hero-slides/reorder`

Reorder all hero slides by providing an ordered list of IDs.

- **Auth:** 🔐 Admin

**Request:**
```json
{
  "ordered_ids": [
    "uuid-of-slide-3",
    "uuid-of-slide-1",
    "uuid-of-slide-2"
  ]
}
```

**Response (200):** All slides with updated `sort_order` values (0, 1, 2...).

**Errors:**
| Code | Reason |
|------|--------|
| 404  | One or more slide IDs not found |

---

### PUT `/api/v1/admin/hero-slides/{slide_id}`

Update a hero slide. Only provided fields are updated.

- **Auth:** 🔐 Admin

**Response (200):** Updated hero slide object.

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Slide not found |

---

### DELETE `/api/v1/admin/hero-slides/{slide_id}`

Delete a hero slide.

- **Auth:** 🔐 Admin

**Response:** 204 No Content

**Errors:**
| Code | Reason |
|------|--------|
| 404  | Slide not found |

---

## Admin — Users

### GET `/api/v1/admin/users`

List all admin/editor users.

- **Auth:** 🔐 Admin

**Response (200):**
```json
[
  {
    "id": "uuid",
    "email": "admin@g-math.co.il",
    "full_name": "Admin User",
    "role": "admin",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```

---

### POST `/api/v1/admin/users`

Create a new admin or editor user.

- **Auth:** 🔐 Admin

**Request:**
```json
{
  "email": "editor@g-math.co.il",
  "password": "strong-password",
  "full_name": "New Editor",
  "role": "editor"
}
```

> `role` can be `"admin"` or `"editor"`.

**Response (201):** User object (without password).

**Errors:**
| Code | Reason |
|------|--------|
| 409  | Email already exists |

---

## Admin — Files

### POST `/api/v1/admin/files/upload`

Upload a content file for a lesson.

- **Auth:** 🔐 Admin
- **Content-Type:** `multipart/form-data`

**Form Fields:**
| Field       | Type       | Required | Description                                     |
|-------------|------------|----------|-------------------------------------------------|
| `file`      | File       | Yes      | The file to upload                              |
| `lesson_id` | UUID       | Yes      | Target lesson                                   |
| `file_type` | string     | Yes      | `"presentation"`, `"worksheet"`, `"geogebra"`, or `"video"` |
| `display_name` | string | For ZIPs | Trimmed student-facing name, 1–300 characters; optional for legacy formats |

Accepted extensions: `.zip`, `.html`, `.pdf`, `.pptx`, `.ggb`, `.mp4`. ZIP uploads
must have `file_type=presentation` and a name. A complete HTML export must
contain exactly one `index.html`, either at its root or inside one wrapper
folder, with all relative assets preserved. Unicode folder/asset names are
supported. New uploads append to the lesson's content order and have unique
storage directories, so identical original filenames cannot overwrite files.

Limits are 50 MiB uploaded, 200 MiB expanded and 2,000 archive entries.
Malformed/encrypted ZIPs, symbolic links, unsafe/duplicate/conflicting paths,
ambiguous entry points and excessive sizes are rejected with 400. Missing or
invalid form fields return 422; a missing lesson returns 404.

**Response (201):**
```json
{
  "id": "uuid",
  "lesson_id": "uuid",
  "file_type": "presentation",
  "file_url": "/api/v1/presentations/lesson-uuid/file-uuid/index.html",
  "display_name": "Common factor",
  "sort_order": 0,
  "created_at": "2025-01-01T00:00:00"
}
```

---

### GET `/api/v1/admin/files`

List all uploaded files.

- **Auth:** 🔐 Admin

**Response (200):** Array of content file objects.

---

### GET `/api/v1/admin/files/lesson/{lesson_id}`

List files for a specific lesson.

- **Auth:** 🔐 Admin

**Response (200):** Array of content file objects for that lesson.

---

### PATCH `/api/v1/admin/files/{file_id}`

Rename content. Admin authentication required.

```json
{"display_name": "New presentation name"}
```

Returns the updated content file (200). Empty/overlong names return 422; an
unknown file returns 404.

### PUT `/api/v1/admin/files/lesson/{lesson_id}/order`

Reorder a lesson's complete content list. Admin authentication required.

```json
{"file_ids": ["second-file-uuid", "first-file-uuid", "worksheet-uuid"]}
```

The list must contain every file of this lesson exactly once, including
non-presentation resources. Missing, duplicate or foreign IDs return 400.
Returns ordered content records (200).

### GET `/api/v1/admin/files/{file_id}/download`

Authenticated download of the original file. ZIP presentations return the
original ZIP rather than their HTML entry point. Missing files return 404.

### GET `/api/v1/presentations/{lesson_id}/{file_id}/{asset_path}`

Public playback HTML/assets for an existing content record. Asset paths are
contained within the upload's extracted `web` directory; the original ZIP is
not exposed here. HTML executes in an opaque sandbox without application
storage/DOM access. Fonts/assets permit anonymous CORS, and framing is allowed
for the same origin and configured `CORS_ORIGINS`. Missing/unsafe paths return
404. Existing `/media/content/` records remain usable.

For compatible iSpring exports, the HTML response includes a frame-local player
adapter. The stored HTML, other assets and downloadable original ZIP remain
unchanged. The adapter exposes actual page counts and navigation through the
validated `gmath.presentation.v1` message protocol, without granting the iframe
access to the parent application.

### GET `/api/v1/presentations/player-bridge.js`

Public JavaScript adapter used by compatible presentation playback responses.
Unknown HTML exports are served unchanged and retain native navigation. Commands
are limited to previous, next and a valid page index; SDK failures and authored
navigation restrictions are reported explicitly.

---

### DELETE `/api/v1/admin/files/{file_id}`

Delete an uploaded file and its owned assets/original archive. Deleting a
lesson also removes its content storage.

- **Auth:** 🔐 Admin

**Response:** 204 No Content

---

## Admin — Settings

### GET `/api/v1/admin/settings`

Get all site settings (key-value pairs).

- **Auth:** 🔐 Admin

**Response (200):**
```json
{
  "site_name": "G-math",
  "maintenance_mode": "false",
  "default_locale": "he"
}
```

---

### PUT `/api/v1/admin/settings`

Update one or more site settings.

- **Auth:** 🔐 Admin

**Request:**
```json
{
  "site_name": "G-math v2",
  "maintenance_mode": "true"
}
```

**Response (200):** Updated settings object.

**Home-page content keys** (read publicly via `GET /api/v1/site-content`; edited in the admin
under "Home content"):

| Key | Description |
|-----|-------------|
| `home.trust.{1-3}.icon` | Trust card emoji/icon |
| `home.trust.{1-3}.text_{he,en,ar}` | Trust card text |
| `home.about.title_{he,en,ar}` | About section title |
| `home.about.body_{he,en,ar}` | About body; blank line separates paragraphs |
| `home.about.button_{he,en,ar}` | About button text (empty hides the button) |
| `home.about.button_link` | About button link, e.g. `/about-mathematics` or `/#topics` |

---

## Admin — Stats

### GET `/api/v1/admin/stats`

Get aggregate statistics for the admin dashboard.

- **Auth:** 🔐 Admin

**Response (200):**
```json
{
  "total_topics": 9,
  "total_subtopics": 20,
  "total_lessons": 58,
  "total_files": 42,
  "total_users": 3
}
```

---

## Admin — Lessons (List All)

### GET `/api/v1/admin/lessons`

List all lessons with optional filtering by topic or subtopic.

- **Auth:** 🔐 Admin

**Query Parameters:**
| Param         | Type   | Required | Description                   |
|---------------|--------|----------|-------------------------------|
| `topic_id`    | UUID   | No       | Filter lessons by topic       |
| `subtopic_id` | UUID   | No       | Filter lessons by subtopic    |

**Response (200):** Array of lesson objects.

---

## Admin — File Download

### GET `/api/v1/admin/files/{file_id}/download`

Download a content file by ID.

- **Auth:** 🔐 Admin

**Path Parameters:**
| Param     | Type | Description           |
|-----------|------|-----------------------|
| `file_id` | UUID | ID of the content file |

**Response:** File stream with appropriate `Content-Type` and `Content-Disposition` headers.

**Errors:**
| Code | Reason |
|------|--------|
| 404  | File not found |

---

## Admin Frontend Integration

The standalone admin frontend (`admin-frontend/`, port 5174) consumes the following API groups:

| Admin UI Page   | Primary Endpoints                                                         |
|-----------------|---------------------------------------------------------------------------|
| Login           | `POST /api/v1/auth/login`, `GET /api/v1/auth/me`                         |
| Dashboard       | `GET /api/v1/admin/stats`                                                 |
| Topics          | `GET/POST/PUT/DELETE /api/v1/admin/topics`                                |
| Subtopics       | `GET /api/v1/admin/topics/{id}/subtopics`, `POST/PUT/DELETE /api/v1/admin/subtopics` |
| Lessons         | `GET /api/v1/admin/lessons`, `GET /api/v1/admin/subtopics/{id}/lessons`, `POST/PUT/DELETE /api/v1/admin/lessons` |
| Hero Slides     | `GET/POST/PUT/DELETE /api/v1/admin/hero-slides`, `PUT .../reorder`        |
| Files           | `POST /api/v1/admin/files/upload`, `GET /api/v1/admin/files/lesson/{id}`, `GET .../download`, `DELETE` |
| Settings        | `GET/PUT /api/v1/admin/settings`                                          |
| Users           | `GET/POST /api/v1/admin/users`                                            |

The admin frontend proxies all `/api` requests to the backend via its Vite dev server config.

---

## Authentication Header

All admin endpoints require:

```
Authorization: Bearer <jwt_token>
```

Get a token from `POST /api/v1/auth/login`.

## Common Error Response Format

```json
{
  "detail": "Error description"
}
```

## Endpoint Summary

| Category        | Endpoints | Auth     |
|-----------------|-----------|----------|
| Auth            | 2         | Mixed    |
| Health          | 1         | Public   |
| Public Topics   | 2         | Public   |
| Public Lessons  | 1         | Public   |
| Public Hero     | 1         | Public   |
| Admin Topics    | 4         | Admin    |
| Admin Subtopics | 4         | Admin    |
| Admin Lessons   | 5         | Admin    |
| Admin Hero      | 5         | Admin    |
| Admin Users     | 2         | Admin    |
| Admin Files     | 5         | Admin    |
| Admin Settings  | 2         | Admin    |
| Admin Stats     | 1         | Admin    |
| **Total**       | **35**    |          |
