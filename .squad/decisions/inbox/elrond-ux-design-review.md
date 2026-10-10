# Architectural Review: Galadriel UX Design v4

| Field         | Value                                    |
|---------------|------------------------------------------|
| **Reviewed by** | Elrond (Architect)                     |
| **Date**        | 2026-04-06                             |
| **Reviewing**   | `galadriel-ux-design-v4.md`            |
| **Status**      | Review Complete — Conditional Approval  |

---

## Overall Assessment

The design is **well-structured and architecturally sound**. Galadriel has made strong choices that align with our system architecture. The 3-page model (Home → Topic → Lesson) maps directly to our database schema and API contracts.

**Verdict: ✅ Approved with conditions** (see below)

## What Works Well

### 1. Clean Page Model → Clean API Contracts
The 3-page structure maps directly to REST endpoints:
- `GET /api/topics` → Homepage grid
- `GET /api/topics/{slug}` → Topic page with subtopics + lessons
- `GET /api/topics/{slug}/subtopics/{id}/lessons/{id}` → Lesson page with presentations

The chip + scroll layout on the topic page means we load **one API call** per topic page (all subtopics + lessons), which is efficient.

### 2. Floating Overlay (Option B) — Correct Choice
This avoids layout shifts and works well with the iframe viewer:
- The overlay sits **above** the iframe in z-index (no clipping issues)
- The backdrop prevents accidental iframe interaction while browsing lessons
- Full-width viewer gives the iframe maximum space (critical for math content with formulas)

### 3. i18n Architecture — Properly Separated
Galadriel correctly separated:
- **UI i18n** (button labels, placeholders) → maps to `react-i18next` JSON files
- **Content direction** (`dir` attribute switching) → CSS logical properties (`inset-inline-start`, `padding-inline`)

The use of CSS logical properties throughout is excellent — this eliminates the need for separate RTL/LTR stylesheets.

### 4. Design Token System
The token approach (`--g-blue`, `--bd`, `--bg`, `--ts`) maps to a CSS custom property theme that can be loaded from the database or config. Facilitates future theming.

## Conditions for Full Approval

### Condition 1: Zoom Strategy Clarification ⚠️
CSS `transform: scale()` on the root **will not** scale iframe content (iframes have their own document). Two approaches:

**Option A (Recommended):** Zoom controls send a `postMessage` to the iframe to adjust its own `font-size` or `zoom` CSS property.
**Option B:** Use CSS `zoom` property (non-standard but widely supported) instead of `transform: scale()`.

**Action:** @Galadriel to decide on zoom approach. @Legolas to validate browser support.

### Condition 2: Presentation Count — API Contract Needed
The design shows presentation counts everywhere (topic cards, lesson list, overlay panel). We need to define:

```
GET /api/topics/{slug}
Response: {
  subtopics: [{
    id, name,
    lessons: [{
      id, name,
      presentation_count: number  // ← must be in API
    }]
  }]
}
```

**Action:** @Gimli to include `presentation_count` in the Lesson model. This is a simple `COUNT` on the presentations table.

### Condition 3: Fullscreen + Iframe Interaction
`requestFullscreen()` on a container div works, but when the actual viewer is an iframe, we should fullscreen the **iframe itself** (not the wrapper div) to give the presentation native fullscreen behavior.

**Action:** @Legolas to implement fullscreen on the iframe element, with a fallback to the container.

### Condition 4: Search Implementation Scope
The real-time search on the topic page filters subtopics and lessons **client-side**. This is correct for our data size (each topic has 3-8 subtopics, each with 3-10 lessons). No server-side search needed at POC scope.

**No action needed** — confirming this is fine as-is.

## Architecture Mapping

| Design Element | Architecture Component | Notes |
|---------------|----------------------|-------|
| Homepage topic grid | `GET /api/topics` + React `TopicGrid` component | Server returns all 9 topics |
| Topic page chips | Client-side filtering of subtopics | Data from single API call |
| Lesson overlay panel | Client-side lesson list | Data already loaded with topic |
| Presentation viewer | Sandboxed `<iframe>` | Per ADR-001 |
| Zoom controls | CSS custom properties + postMessage to iframe | Condition 1 |
| Language switcher | `react-i18next` + `document.dir` | Already architected |
| Fullscreen | Browser Fullscreen API on iframe | Condition 3 |

## Component Decomposition Suggestion

For @Legolas to review:

```
App
├── Layout (Header + Footer + Zoom + LangSwitcher)
├── HomePage
│   ├── Hero
│   └── TopicGrid → TopicCard (×9)
├── TopicPage
│   ├── ChipBar (SubtopicChips + SearchInput)
│   └── SubtopicSection (×N) → LessonItem (×N)
└── LessonPage
    ├── TitleBar
    ├── PresentationViewer (iframe)
    ├── ControlBar (PrevNext + PresDots + Actions)
    └── LessonOverlay (Backdrop + Panel + Search + LessonList)
```

## Final Verdict

| Criterion | Status |
|-----------|--------|
| Aligns with system architecture | ✅ |
| i18n / RTL approach | ✅ |
| API contract compatibility | ✅ (with presentation_count addition) |
| Iframe viewer compatibility | ✅ (with zoom + fullscreen conditions) |
| Scalability (9 topics, ~50 subtopics, ~200 lessons) | ✅ |
| WCAG 2.1 AA accessibility | ✅ |

**This design is approved for task breakdown and sprint planning.**
Awaiting product owner + family approval before development begins.

---

> *"The design holds. The foundations are sound. Let us now plan the building of it — but only when the master of the house gives the word."*
> — Elrond
