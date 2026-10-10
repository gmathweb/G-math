# Elrond — History

> What I've learned about this project across sessions.

## Session Log

### Session 1 — 2025-07-14: The Council Convenes

**Task:** Design the foundational system architecture for G-mathPOC.

**Artifacts produced:**
- `docs/adr/001-system-architecture.md` — Full ADR covering system overview, content model, i18n architecture, frontend architecture, backend architecture, and monorepo folder structure
- `.squad/decisions/inbox/elrond-system-architecture.md` — Decision proposal for team review

**Key decisions made:**
1. Single React SPA for student + admin (route-based code splitting)
2. Sandboxed iframe for HTML presentation rendering
3. Filesystem storage for content, PostgreSQL for metadata
4. Locale-per-row content model (not source-language + translations)
5. Strict separation of UI i18n (react-i18next) vs content i18n (DB locale column)
6. Simple JWT admin auth (POC-scoped)
7. Vite as frontend build tool
8. FastAPI with SQLAlchemy + Alembic for backend

**Waiting on:**
- Team review of architecture proposal (all agents tagged in decision inbox)

**Lessons learned:**
- The content model is unusual: Hebrew presentations are NOT translations of English ones — they are independently authored HTML files. This means the typical "source language + translation" pattern doesn't apply. Each locale's content is fully independent.
- GeoGebra integration is a third-party CDN dependency. We should wrap it in a single component to isolate the risk.
