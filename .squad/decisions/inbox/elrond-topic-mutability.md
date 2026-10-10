# Decision: Topic Hierarchy Mutability Rules

**Author:** Elrond
**Date:** 2026-04-03
**Status:** Approved (by product owner)

## Decision

The 3-level content hierarchy has different mutability rules:

| Level | Name | Mutable? | Who manages? |
|-------|------|----------|-------------- |
| Level 1 | Main Topics (9) | **Fixed / Immutable** | Hardcoded — only developers can change |
| Level 2 | Sub-topics | **Mutable** | Teachers/admins via CMS |
| Level 3 | Lessons | **Mutable** | Teachers/admins via CMS |

## Implications

### Backend (@Gimli)
- Main topics are **seed data only** — no CRUD API for topics
- Remove `POST/PUT/DELETE /api/v1/admin/topics` endpoints
- Keep only `GET /api/v1/topics` (read-only, public)
- Sub-topics and lessons retain full CRUD via admin API

### Frontend (@Legolas)
- HomePage renders a **static grid of 9 topics** (order never changes)
- CMS dashboard has **no topic editor** — only sub-topic and lesson editors
- Topic icons/colors can be hardcoded in frontend config

### Database (@Gimli)
- Topics table gets seeded once during deployment
- Consider removing `is_published` from topics (always published)
- Sub-topics and lessons keep full lifecycle (create, edit, publish, delete)

### CMS Admin (@Galadriel)
- Admin dashboard navigation: pick topic → manage sub-topics → manage lessons
- No "add topic" or "delete topic" buttons
