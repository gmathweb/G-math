# Routing Rules

## Work Type → Agent Mapping

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Architecture, system design, tech decisions | @Elrond | API design, DB schema, i18n strategy, service boundaries |
| UI/UX mockups, user flows, accessibility, RTL | @Galadriel | Hebrew RTL design, navigation flow, responsive layout, design system |
| React components, frontend state, i18n frontend | @Legolas | Component tree, React hooks, i18next setup, math rendering |
| Python API, business logic, database, auth | @Gimli | FastAPI endpoints, math engine, user progress, ORM models |
| Testing, QA, test automation | @Aragorn | Unit tests, E2E tests, cross-browser, RTL text tests |
| Logging, monitoring, observability | @Samwise | Structured logging, error tracking, health checks, alerting |
| CI/CD, Docker, deployment, infrastructure | @Faramir | GitHub Actions, Docker compose, env configs, pipelines |
| Decisions, session logs, team memory | @Bilbo | Decision recording, session summaries, knowledge consolidation |

## Routing Principles
- **Default route:** @Gandalf — triages unknown work and delegates
- **Eager spawning:** launch all agents who can usefully start in parallel
- **Multi-language work:** @Elrond architects i18n strategy → @Galadriel handles RTL UX → @Legolas implements frontend i18n → @Gimli handles backend localization
- **Issue labels:** Use `squad:{agent-name}` to route directly
- When two agents could handle it, pick the primary concern owner
- Anticipate downstream work (e.g., spawn @Aragorn with @Legolas for new features)
