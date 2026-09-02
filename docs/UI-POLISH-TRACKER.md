# UI Polish Tracker

Living document for theme polish work. Update status as each system is reviewed or fixed.

**How to use this file**
- Work **one category at a time**, not one page at a time.
- Mark items `done` only after desktop + mobile QA on reference pages.
- Add notes under **Session log** when a batch is completed.
- Detailed file research lives in companion docs (see links below).

**Status legend**
- `not_started` — not reviewed yet
- `in_progress` — audit or fixes underway
- `done` — aligned to target; do not re-touch unless regressions
- `intentional` — different by design; skip unless product decision changes

---

## Reference pages (quick QA sweep)

| Template | URL handle | Use for |
|----------|------------|---------|
| Home | `/` | Shell gutter, section rhythm, carousels |
| Collection | `/collections/all` | Standard page margin, grid, hero overlap |
| Product | any PDP | PDP layout, below-fold sections |
| Contact | `/pages/contact` | Homepage-shell variant |
| Search | `/search?q=test` | Standard margin + grid |
| Cart | `/cart` | Page margin + drawer (separate system) |

---

## Category backlog

### 1. Main container padding & margin (side inset + top offset)

| Item | Status | Target | Notes |
|------|--------|--------|-------|
| Global `--page-margin` token (16px mobile / 40px desktop) | `in_progress` | Single source of truth for standard pages | See [CONTAINER-PADDING-MARGIN-AUDIT.md](./CONTAINER-PADDING-MARGIN-AUDIT.md) |
| Homepage shell outside/inside padding (`--hp-shell-pad-*` / `--hp-pad-*`) | `done` | All 11 index sections use explicit mobile + desktop X/Y | `base.css`, all home `sections/*.liquid` |
| Homepage shell (`--homepage-gutter` 12px / 24px) | `done` | Shell default via `--hp-shell-pad-x-*` fallbacks | Peek hero, immersive video, parallax use 12/24 outside |
| Contact page shell (reuses homepage-shell) | `not_started` | Match home shell rules | Same gutter tokens as home |
| Collection page overlap (`margin-top: -2.75rem`) | `not_started` | Decide standard top offset vs hero | Template-specific override |
| Product page (standard `.section` grid) | `not_started` | Align to `--page-margin` unless full-bleed | PDP has extra clamp() insets |
| Search / cart / blog / 404 (standard templates) | `not_started` | Use global grid; no hardcoded horizontal padding | |
| Header horizontal alignment to page margin | `not_started` | Header columns align with content inset | `header.liquid` uses `--page-margin` |
| Per-section hardcoded `clamp()` horizontal padding | `in_progress` | Home sections migrated; footer/contact/collection remain | See session log |

**Research doc:** [CONTAINER-PADDING-MARGIN-AUDIT.md](./CONTAINER-PADDING-MARGIN-AUDIT.md)

---

### 2. Section spacing (gap between blocks on a page)

| Item | Status | Target | Notes |
|------|--------|--------|-------|
| Define spacing tiers (tight / normal / loose) | `not_started` | 3 values used everywhere | |
| Home template section padding in `index.json` | `done` | Explicit `--hp-shell-pad-*` + `--hp-pad-*` per section | Baseline values from prior audit; tweak per section in Liquid |
| Product template section padding in `product.json` | `not_started` | Normalize to tiers | |
| `spacing-style.liquid` usage audit | `not_started` | All sections use shared snippet | |

---

### 3. Internal section / block padding

| Item | Status | Target | Notes |
|------|--------|--------|-------|
| Token scale (`--padding-sm` … `--padding-6xl`) | `not_started` | No random px values | `theme-styles-variables.liquid` |
| Card interior padding | `not_started` | Unified scale | BSS card, drawers, filters |
| Filter / drawer panel padding | `not_started` | Match scale | `blocks/filters.liquid` |

---

### 4. Typography (headings & body)

| Item | Status | Target | Notes |
|------|--------|--------|-------|
| Global type scale (H1–H6, body, label) | `not_started` | Via `typography-style.liquid` | |
| Hardcoded `font-size: clamp(...)` audit | `not_started` | Map to presets or document | Many custom sections |
| Heading spacing (`--font-heading--spacing`) | `not_started` | Consistent margin below headings | |

---

### 5. Border radius

| Item | Status | Target | Notes |
|------|--------|--------|-------|
| Global radius tokens | `not_started` | `--style-border-radius-*` | |
| Homepage shell radius (`--homepage-radius: 25px`) | `intentional` | Keep unless shell redesign | |
| Collection card overlap radius (28px / 20px mobile) | `not_started` | Align with shell scale | |
| Product media / card radius (18px in settings) | `not_started` | Single scale | |

---

### 6. Product cards (grid contexts)

| Item | Status | Target | Notes |
|------|--------|--------|-------|
| Unify grid cards on BSS (`bss-product-card`) | `not_started` | Collection = canonical | |
| Search / recommendations default card | `not_started` | Switch or align to BSS | `_product-card.liquid` fork |
| Product Also Like (`pal-card`) | `not_started` | Merge into BSS | Duplicate markup |
| Mega menu compact card | `intentional` | Token-align only | Space-constrained |
| Cart drawer upsell mini card | `intentional` | Token-align only | Horizontal layout |

---

### 7. Carousels (controls, gaps, peek)

| Item | Status | Target | Notes |
|------|--------|--------|-------|
| Shared arrow / dot styling | `not_started` | One visual language | Many JS carousels |
| Track gap consistency | `not_started` | Token-based gaps | |
| Peek / side inset alignment | `not_started` | Relate to page margin or homepage gutter | |

---

### 8. Buttons & form inputs

| Item | Status | Target | Notes |
|------|--------|--------|-------|
| `--button-padding-inline` consistency | `not_started` | All CTAs | |
| Input padding / radius | `not_started` | Theme settings tokens | |

---

### 9. Drawers & modals (cart, search, filters)

| Item | Status | Target | Notes |
|------|--------|--------|-------|
| `--theme-drawer-width` / `--drawer-padding` | `not_started` | Unified drawer spacing | |
| Cart drawer | `not_started` | | |
| Search modal | `not_started` | | |
| Filter drawer | `not_started` | | |

---

### 10. Navbar (utility bar + main menu)

| Item | Status | Target | Notes |
|------|--------|--------|-------|
| Utility bar height 56px + 18px vertical padding | `done` | Fixed height; square top corners | `reference-utility-bar.liquid` |
| Main menu row height 96px (64px mobile) | `done` | Vertically centered nav + icons | `header.liquid` |
| Transparent menu on `/collections/all` only | `done` | White text over collection hero | `header.liquid` — `collection.handle == 'all'` |
| Solid white menu on home, contact, product, other collections | `done` | `#ffffff` bg, `#111111` text | `base.css` template rules |
| Nav pill hover | `intentional` | Already implemented | `_header-menu.liquid` — do not change |
| `--header-height` cascade updates | `done` | Fallbacks 60px → 96px | `base.css`, contact, bundle-builder, utility rail |
| Nav item typography (15.4277px Inter, #171717 solid) | `done` | Solid white bar only; transparent stays white | `menu-font-styles.liquid`, `_header-menu.liquid` |

---

## Session log

| Date | Category | What was done | Files touched | QA |
|------|----------|---------------|---------------|-----|
| 2026-08-18 | Container padding & margin | Created audit + tracker docs; no code changes | `docs/UI-POLISH-TRACKER.md`, `docs/CONTAINER-PADDING-MARGIN-AUDIT.md` | — |
| 2026-08-19 | Navbar | Utility bar 56px/18px; menu 96px; transparent only on `/collections/all` | `reference-utility-bar.liquid`, `header.liquid`, `base.css`, `contact-page.liquid`, `bundle-builder.liquid` | Pending visual QA |
| 2026-08-30 | Navbar typography | Nav items 15.4277px Inter, #171717 on solid bar | `menu-font-styles.liquid`, `_header-menu.liquid` | Pending visual QA |
| 2026-08-30 | Navbar hover | Fixed Collections→Shop swipe + downward panel gap | `header-menu.js` | User confirmed |
| 2026-08-30 | Home hero carousel | Shell X padding 0 (edge-to-end); gutter tiers 12/24/36px; 5% peek confirmed | `peek-hero-carousel.liquid`, `base.css` | Pending visual QA |

---

## Decisions log

Record product/design decisions so later sessions don't re-debate them.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-18 | Start polish with **main container padding & margin** before cards/typography | Highest leverage; frames all content |
| 2026-08-18 | Homepage + contact use a **separate shell system** (`--homepage-gutter`), not `--page-margin` | Intentional rounded-shell layout in `base.css` |
| 2026-08-19 | **Transparent navbar** only on `/collections/all` (Shop route); all other pages solid white | Matches reference mockups |
| 2026-08-19 | Navbar dimensions: utility bar **56px** (18px py), menu row **96px** desktop / **64px** mobile | Fixed tokens in header + utility bar CSS |
| 2026-08-30 | Nav items: **15.4277px Inter**, **#171717** on solid navbar | Transparent `/collections/all` keeps white text |
| 2026-08-30 | Home padding uses **`--hp-shell-pad-*`** (outside) + **`--hp-pad-*`** (inside) with separate mobile/desktop values | Per-section overrides in each section Liquid file; shell consumes vars in `base.css` |

---

## Companion docs

| Doc | Purpose |
|-----|---------|
| [CONTAINER-PADDING-MARGIN-AUDIT.md](./CONTAINER-PADDING-MARGIN-AUDIT.md) | File-level research for category 1 |
| *(future)* `SECTION-SPACING-AUDIT.md` | Section gap tiers + JSON values |
| *(future)* `PRODUCT-CARDS-AUDIT.md` | All card implementations |
| *(future)* `CAROUSELS-AUDIT.md` | Carousel instances + controls |
