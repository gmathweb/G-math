# Decision Proposal: System Architecture

| Field         | Value                                |
|---------------|--------------------------------------|
| **Proposed by** | Elrond (Architect)                 |
| **Date**        | 2025-07-14                         |
| **ADR**         | `docs/adr/001-system-architecture.md` |
| **Status**      | Proposed — awaiting team review    |

---

## Summary

I propose the foundational system architecture for G-mathPOC. This covers all layers from database to frontend routing. The full rationale is in ADR-001, but here are the key decisions the fellowship must review:

## Key Decisions

### 1. Single React App (Student + Admin CMS)
One React SPA with route-based code splitting. Admin routes (`/admin/*`) are lazy-loaded and protected by auth. Student routes are fully public.

**Trade-off:** Larger potential bundle vs. shared component library and simpler deployment.
**@Legolas** — please review whether this is feasible with Vite code splitting.

### 2. HTML Presentations Rendered in Sandboxed Iframes
External HTML files are served by nginx as static files and embedded in `<iframe sandbox="allow-scripts allow-same-origin">`.

**Trade-off:** True CSS/JS isolation vs. cross-frame communication complexity.
**@Galadriel** — please consider the UX implications (scrolling, responsive sizing, accessibility).

### 3. Content Stored on Filesystem, Metadata in PostgreSQL
HTML files live on disk at `/media/content/...`, served directly by nginx. PostgreSQL stores metadata, structure, and GeoGebra configurations (JSONB).

**Trade-off:** Simple and fast vs. doesn't scale to multi-server without shared storage.
**@Gimli** — please review the file upload flow and versioning strategy.

### 4. Locale-Per-Row Content Model
Each content item (presentation, working page, GeoGebra activity) has a `locale` column. Content exists independently per language — no "source language + translations" pattern.

**Why:** Hebrew presentations are not translations of English ones. They may be completely different files authored independently.

### 5. Strict Separation: UI i18n vs. Content i18n
- UI strings → `react-i18next` with JSON files in the frontend
- Content → database locale column + locale-specific files on disk

These are two independent systems that share only the locale code.

### 6. Simple JWT Admin Auth
Single admin login with JWT. No refresh tokens, no RBAC. Environment variable for initial credentials.

**This is POC-scoped.** Adequate for teachers uploading content. Not adequate for production with many admins.

### 7. Vite for Frontend Build
Not Create React App (deprecated), not Next.js (SSR unnecessary for this use case).

## What I Need From the Team

| Agent | Review Focus |
|-------|-------------|
| **@Gandalf** | Does this scope match sprint priorities? |
| **@Galadriel** | Iframe UX, RTL switching UX, admin dashboard UX flow |
| **@Legolas** | React architecture feasibility, Vite config, GeoGebra integration |
| **@Gimli** | FastAPI structure, file upload logic, SQLAlchemy schema |
| **@Aragorn** | Testability of the architecture (API tests, iframe content tests) |
| **@Faramir** | Docker Compose setup, nginx config, deployment strategy |

## Blocking Questions

None — this proposal is ready for review. If no objections within 2 sessions, I will mark it as **Accepted** and the implementation agents can begin scaffolding.

---

> *"The fate of the application depends on getting this right. I have considered the angles. Now I ask the fellowship to consider them too."*
> — Elrond
