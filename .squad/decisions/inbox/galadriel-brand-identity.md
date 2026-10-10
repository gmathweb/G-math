# Decision: G-mathPOC Brand Identity

**Author:** Galadriel
**Date:** 2026-04-03
**Status:** Approved (based on existing POC branding)

## Brand Elements

### Logo
- **Icon:** Stylized green "G" swoosh with blue "Math" text
- **Tagline:** מתמטיקה לכל ("Mathematics for All")
- **Source:** Existing POC at http://www.g-math.co.il/
- **Icon files:** `frontend/public/assets/gmath-icon-192.png`, `frontend/public/assets/favicon.png`

### Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| G-Green (primary) | `#8BC34A` | Logo G, primary actions, success states |
| G-Blue (secondary) | `#1565C0` | Logo "Math" text, links, headings |
| White | `#FFFFFF` | Background |
| Dark text | `#212121` | Body text |
| Light gray | `#F5F5F5` | Section backgrounds |

### Typography
| Usage | Hebrew Font | Latin Font |
|-------|-------------|------------|
| Headings | Assistant | Roboto Slab |
| Body text | Rubik | Roboto |
| Math/Code | System monospace | Roboto Mono |

### Existing Site Analysis (www.g-math.co.il)
- Built with WordPress + Elementor (to be replaced by React)
- RTL-first: `<html dir="rtl" lang="he-IL">`
- Content model: presentations + practice exercises (matches our architecture)
- Hosted on Cloudways

## Impact
- @Legolas: Apply color palette and fonts in the React app CSS/theme
- @Galadriel: Use these as the foundation for the full design system
- @Faramir: Include font imports in the build pipeline
