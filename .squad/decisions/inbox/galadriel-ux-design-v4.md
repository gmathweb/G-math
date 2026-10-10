# Decision: UX Design Specification — Full Site Prototype v4

| Field         | Value                                    |
|---------------|------------------------------------------|
| **Proposed by** | Galadriel (UX Designer)                |
| **Date**        | 2026-04-06                             |
| **Status**      | Proposed — awaiting @Elrond + Owner review |

---

## Summary

After 12+ design iterations with the product owner, the following UX design has been finalized for G-mathPOC. The interactive prototype is at `.superpowers/brainstorm/*/full-site-v4.html`.

## Pages & Layout

### 1. Homepage
- **Hero section:** Gradient background, tagline, subtitle
- **Topic grid:** 9 topic cards in a responsive grid (3→2→1 columns)
- **"About Mathematics" card** gets a unique design: 8 math-branch sub-cards in a grid (differs from other topics)
- Each topic card: icon, name, description, topic-specific color

### 2. Topic Page (Chip + Scroll Layout — "Option C")
- **Sticky chip bar** at top: subtopic filter chips + real-time search input
- **Search positioned** at `inline-end` (left in RTL Hebrew, right in LTR English)
- **Subtopic sections:** Each subtopic is a separate card with:
  - Color accent bar at top (topic color)
  - Lesson items: name + presentation count (e.g., "📄 3 מצגות")
  - Horizontal flex-wrap layout (side-by-side when space allows, max-width 420px)
- **Chip click behavior:** Scale up (1.03) + deep shadow on selected section, others shrink (0.96) + fade, resets after 3.5s
- Search highlights matching lessons within topic color

### 3. Lesson/Presentation Page (Floating Overlay — "Option B")
- **Full-width viewer** — no permanent sidebar, maximum space for presentations
- **Title bar:** Lesson name + presentation count badge
- **Viewer area:** min-height 320px, slide label in top corner ("מצגת 1 / 3")
- **Control bar (single row):**
  - Left group: ← prev + presentation dots (1, 2, 3) + next → + counter
  - Right group: 📋 Lessons button + ⛶ Fullscreen + 📥 Worksheet
- **Floating overlay panel** (triggered by 📋 button):
  - Slides in from `inline-start` (right in RTL, left in LTR)
  - Semi-transparent backdrop with blur
  - Search input to filter lessons
  - Lesson items show: number, name, presentation count, "current" badge
  - Click backdrop or ✕ to close
- **Fullscreen:** Uses browser Fullscreen API on the viewer element
- Prev/Next navigate **between presentations** within a lesson (not between lessons)

## Global Components

### Sticky Footer
- **Single line** containing: Brand ("G-Math · מתמטיקה לכל · © 2024"), zoom controls, language switcher
- **Zoom:** − / percentage / + buttons, range 70%–150%, uses CSS `--zoom` custom property via `transform: scale(var(--zoom))`
- **Language switcher:** HE / EN / AR buttons, switches `dir` (rtl↔ltr), all text updates dynamically
- `position: fixed; bottom: 0` — always visible

### Header
- Logo, navigation links (Home, About, Contact)
- Clean, minimal

### Breadcrumbs
- Present on Topic and Lesson pages
- Clickable navigation back to parent levels

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--g-blue` | `#4361ee` | Primary actions, active states |
| `--bd` | `#e2e8f0` | Borders |
| `--bg` | `#ffffff` | Backgrounds |
| `--ts` | `#64748b` | Secondary text |
| `--tm` | `#94a3b8` | Muted text |
| Border radius | `8-12px` | Cards, buttons |
| Font | `Segoe UI, system-ui` | All text (POC; will use Rubik/Assistant in production) |

## Topic Colors (9 topics)

| Topic | Color | Background |
|-------|-------|------------|
| About Mathematics | `#FF6B6B` | `#FFE8E8` |
| Algebra | `#4361ee` | `#E8EDFF` |
| Trigonometry | `#7C3AED` | `#F0E6FF` |
| Calculus | `#059669` | `#D1FAE5` |
| Spatial Engineering | `#EA580C` | `#FFF1E6` |
| Analytic Geometry | `#0891B2` | `#E0F7FA` |
| Vectors | `#D97706` | `#FEF3C7` |
| Geometry | `#607D8B` | `#ECEFF1` |
| Probability | `#E91E63` | `#FCE4EC` |

## i18n / RTL Behavior
- **3 languages:** Hebrew (he, RTL), English (en, LTR), Arabic (ar, RTL)
- Language switch updates: `document.documentElement.dir`, `lang`, all visible text
- Search input placeholder changes per language
- Chip bar uses `flex-direction: row-reverse` so search naturally positions at `inline-end`
- Overlay panel uses `inset-inline-start` for correct RTL/LTR positioning

## Accessibility (WCAG 2.1 AA)
- Zoom 70%–150% always available in footer
- Sufficient color contrast on all topic colors
- Interactive elements have hover/focus states
- Disabled buttons at `.35` opacity with `cursor: not-allowed`

## What I Need

| Agent | Review Focus |
|-------|-------------|
| **@Elrond** | Architecture alignment: Does this design map cleanly to the system architecture? Iframe viewer strategy? i18n implementation? |
| **@Legolas** | React component decomposition feasibility. Can this be built with the existing stack? |
| **@Gandalf** | Task breakdown and sprint planning |

## Open Questions for @Elrond
1. The viewer area currently shows a placeholder. Elrond's architecture calls for sandboxed iframes for HTML presentations. Does the floating overlay panel conflict with iframe z-index/focus?
2. The zoom uses CSS transform — will this play well with iframe content?
3. Presentation count is mock data. How will the API surface this? (nested count in topic → subtopic → lesson → presentations)

---

> *"The design has been shaped by many voices. Now it must withstand the scrutiny of those who will build it."*
> — Galadriel 🌿
