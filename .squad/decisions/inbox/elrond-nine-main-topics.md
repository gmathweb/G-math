# Decision: Define the 9 Main Math Topics

**Author:** Elrond
**Date:** 2026-04-03
**Status:** Approved (by product owner)

## Decision

The platform has exactly 9 main math topics, ordered as follows:

| # | Hebrew | English | Slug |
|---|--------|---------|------|
| 1 | על המתמטיקה | About Mathematics | `about-mathematics` |
| 2 | אלגברה | Algebra | `algebra` |
| 3 | טריגונומטריה | Trigonometry | `trigonometry` |
| 4 | חדו״א | Differential and Integral Calculus | `calculus` |
| 5 | הנדסת המרחב | Spatial Engineering | `spatial-engineering` |
| 6 | אנליטית | Analytic | `analytic` |
| 7 | וקטורים | Vectors | `vectors` |
| 8 | גיאומטריה | Geometry | `geometry` |
| 9 | הסתברות | Probability | `probability` |

## Impact
- @Gimli: Seed data migration needed for topics + topic_translations tables
- @Legolas: HomePage renders these 9 topic cards in this order
- @Galadriel: Design icons/colors for each topic card
- @Elrond: Sub-topic breakdown needed for each main topic (next step)
