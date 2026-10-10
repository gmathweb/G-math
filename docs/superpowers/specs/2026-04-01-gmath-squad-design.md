# G-mathPOC Squad Design

**Date:** 2026-04-01
**Status:** Approved

## Overview
Design specification for the G-mathPOC AI agent squad — a team of 9 specialized agents built using the Squad methodology to develop a multilingual math learning web platform.

## Project Context
- **Product:** Math learning web app for high school+ students
- **Languages:** Hebrew (primary, RTL) → English (LTR) → Arabic (RTL)
- **Frontend:** React 18+, TypeScript, i18next, KaTeX/MathJax
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL
- **Infrastructure:** Docker, GitHub Actions, nginx

## Squad Approach
Manual `.squad/` directory following bradygaster/squad conventions. Pure markdown, no npm dependency. Lord of the Rings themed casting.

## Team Composition

| Character | Role | Key Methodology |
|-----------|------|----------------|
| Gandalf | Coordinator | Task routing, conflict resolution |
| Elrond | Architect / Planner | ADRs, i18n-first design |
| Galadriel | UX Designer | Latest UX: atomic design, JTBD, design thinking, WCAG 2.1 |
| Legolas | Frontend Dev (React) | Design Patterns: SOLID, composition, strategy, factory |
| Gimli | Backend Dev (Python) | Design Patterns: repository, DI, strategy, SOLID |
| Aragorn | Tester | TDD, testing pyramid, cross-language validation |
| Samwise | Logger / Monitoring | Structured logging, Sentry, Prometheus/Grafana |
| Faramir | DevOps | Docker-first, GitHub Actions CI/CD, zero-downtime |
| Bilbo | Scribe (silent) | Decision logging, session archives, knowledge consolidation |

## Routing
Work is routed by type to the appropriate agent. @Gandalf is the default router. Multi-language work follows: @Elrond (strategy) → @Galadriel (RTL UX) → @Legolas (frontend i18n) → @Gimli (backend i18n).

## Key Design Decisions
1. **i18n-first:** Hebrew RTL is the primary design direction
2. **Design Patterns:** Both frontend and backend follow established DP
3. **Latest UX:** Galadriel uses modern UX methodologies (atomic design, JTBD, progressive disclosure)
4. **Squad-compatible:** Structure can be upgraded to the squad CLI when ready
5. **Git-tracked:** All squad files live in the repo — knowledge compounds

## Directory Structure
See `.squad/` directory in the repository root.
