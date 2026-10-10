# Decision: Topics, Subtopics and Home Texts Are Admin-Editable

**Date:** 2026-10-09
**Status:** Approved (by product owner)
**Supersedes (where they conflict):** `elrond-topic-mutability.md`, `elrond-nine-main-topics.md`

## Decision

The site is handed over to a non-developer who manages it through the admin, so content lives in
Postgres, not in code:

| Content | Editable in admin | Stored in |
|---------|-------------------|-----------|
| Main topics (name/description in he/en/ar, icon, colours, order, published) | Yes — full CRUD | `topics` |
| Subtopics (names in he/en/ar, icon glyph, order, published) | Yes — full CRUD | `subtopics` (`icon` column added in migration `002_subtopic_icon`) |
| Lessons, presentations, hero slides | Yes (unchanged) | existing tables |
| Home trust cards and About section | Yes — "Home content" page | `site_config`, keys `home.*` |

- The nine main topics are now **seed defaults**, not a fixed list: the seed creates them on an
  empty database, and admins may rename, reorder, add or remove topics afterwards.
- The seed never overwrites admin edits (it only fills in missing rows/keys).
- The student site reads home texts from `GET /api/v1/site-content` and falls back to built-in
  translations only if that request fails.

## Why

The product owner will deploy the site and hand it over; every visible text must be changeable
without a code change or redeploy.
