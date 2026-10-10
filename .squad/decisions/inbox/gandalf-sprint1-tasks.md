# Sprint 1 — Task Breakdown: UX Design Implementation

| Field           | Value                                    |
|-----------------|------------------------------------------|
| **Proposed by** | Gandalf (Coordinator)                    |
| **Date**        | 2026-04-06                               |
| **Status**      | 🔒 BLOCKED — Awaiting owner + family approval |
| **Depends on**  | `elrond-ux-design-review.md` ✅ Approved |
|                 | Product owner family review ⏳ Pending    |

---

## Sprint Goal

Implement the approved Galadriel UX Design v4 in the React frontend, with API endpoints from the backend to support it.

## Pre-Conditions (MUST be met before any task starts)

- [ ] **Product owner approves** the prototype with family
- [ ] **Elrond conditions resolved** (zoom strategy, fullscreen approach)

---

## Task Breakdown

### Phase 1: Foundation (Week 1)

| # | Task | Agent | Description | Depends On |
|---|------|-------|-------------|------------|
| 1.1 | **Design tokens & theme** | @Legolas | Create CSS custom properties file with all design tokens (colors, spacing, radii). Set up topic color map. | — |
| 1.2 | **Layout shell** | @Legolas | `App` → `Layout` component with Header + sticky Footer (zoom + lang switcher). React Router setup for 3 pages. | 1.1 |
| 1.3 | **i18n setup** | @Legolas | Configure `react-i18next` with HE/EN/AR JSON files. Wire language switcher to `document.dir` + i18next. | 1.1 |
| 1.4 | **API: Topics endpoint** | @Gimli | `GET /api/topics` returning all 9 topics with name, icon, color, description, subtopic count. | — |
| 1.5 | **API: Topic detail endpoint** | @Gimli | `GET /api/topics/{slug}` returning subtopics with lessons + `presentation_count`. | — |
| 1.6 | **Database seed data** | @Gimli | Seed script with 9 topics, sample subtopics, sample lessons, sample presentation metadata. | 1.4, 1.5 |

### Phase 2: Pages (Week 2)

| # | Task | Agent | Description | Depends On |
|---|------|-------|-------------|------------|
| 2.1 | **Homepage** | @Legolas | Hero section + `TopicGrid` with 9 `TopicCard` components. "About Mathematics" unique card grid. Responsive breakpoints. | 1.2, 1.3, 1.4 |
| 2.2 | **Topic page** | @Legolas | `ChipBar` (subtopic chips + search) + `SubtopicSection` cards with `LessonItem` components. Chip click highlight animation. | 1.2, 1.3, 1.5 |
| 2.3 | **Lesson page — viewer** | @Legolas | `PresentationViewer` (iframe sandbox), `TitleBar`, slide label. Fullscreen API on iframe. | 1.2, 1.3, 1.5 |
| 2.4 | **Lesson page — controls** | @Legolas | `ControlBar` with presentation dots + prev/next. `LessonOverlay` (floating panel + backdrop + search + lesson list). | 2.3 |
| 2.5 | **Zoom implementation** | @Legolas + @Elrond | Resolve zoom strategy (CSS zoom vs postMessage to iframe). Implement in Footer. | 1.2, Elrond condition 1 |

### Phase 3: Polish & Testing (Week 3)

| # | Task | Agent | Description | Depends On |
|---|------|-------|-------------|------------|
| 3.1 | **RTL/LTR testing** | @Aragorn | Test all 3 pages in HE, EN, AR. Verify layout flips, search position, overlay direction. | 2.1–2.4 |
| 3.2 | **Responsive testing** | @Aragorn | Test breakpoints: desktop (1200+), tablet (600-900), mobile (<600). | 2.1–2.4 |
| 3.3 | **Accessibility audit** | @Aragorn + @Galadriel | WCAG 2.1 AA: focus states, keyboard navigation, color contrast, screen reader labels. | 2.1–2.4 |
| 3.4 | **Integration test** | @Aragorn | API → Frontend integration: topics load, navigation works, presentations display. | 2.1–2.5, 1.6 |
| 3.5 | **Documentation** | @Bilbo | Update README with setup instructions, screenshot of each page, architecture notes. | 3.1–3.4 |

---

## Agent Assignments Summary

| Agent | Tasks | Effort |
|-------|-------|--------|
| **@Legolas** (Frontend) | 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5 | Heavy — primary implementer |
| **@Gimli** (Backend) | 1.4, 1.5, 1.6 | Medium — API + seed data |
| **@Aragorn** (Tester) | 3.1, 3.2, 3.3, 3.4 | Medium — full test pass |
| **@Galadriel** (UX) | 3.3 (advisory) | Light — accessibility review |
| **@Elrond** (Architect) | 2.5 (advisory) | Light — zoom strategy decision |
| **@Bilbo** (Scribe) | 3.5 | Light — docs |
| **@Faramir** (DevOps) | — | Not needed in Sprint 1 (Docker already set up) |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Iframe zoom compatibility | Elrond to decide approach before Phase 2 starts |
| 9 topic colors need contrast testing | Aragorn tests in Phase 3 |
| Arabic translations may be incomplete | Ship HE + EN first, AR as stretch goal |

## Definition of Done

- [ ] All 3 pages render correctly in Hebrew (RTL) and English (LTR)
- [ ] Zoom works (70%–150%) including within presentation iframe
- [ ] Language switcher changes all UI text + direction
- [ ] Topic → Subtopic → Lesson navigation works end-to-end
- [ ] Floating overlay opens/closes with search and lesson switching
- [ ] Fullscreen works on presentation viewer
- [ ] Passes WCAG 2.1 AA basic audit
- [ ] Seed data loads successfully via API

---

> *"The tasks are clear. The fellowship knows its roles. But we move only when the master says 'Go.' Until then — we prepare, but we do not build."*
> — Gandalf 🧙‍♂️
