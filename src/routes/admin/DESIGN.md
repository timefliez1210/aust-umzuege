# Design System Document

## 1. Overview & Creative North Star: "The Architectural Concierge"

Moving is one of life's most chaotic transitions. This design system is built to be the antithesis of that chaos. Our Creative North Star is **"The Architectural Concierge"**—a digital experience that feels as sturdy as a load-bearing wall but as fluid and supportive as a premium service.

We move beyond the "standard app" look by rejecting rigid borders and boxed-in grids. Instead, we use **Intentional Asymmetry** and **Tonal Layering**. By utilizing the high-contrast relationship between deep Navy (`primary`) and the vibrant, energetic Orange (`secondary`), we create a sophisticated editorial layout. The UI should feel like a series of clean, premium surfaces sliding over one another, conveying the precision and reliability of high-end German logistics.

---

## 2. Colors: Depth Over Definition

The palette is rooted in the "Deep Sea" Navy of the brand, contrasted with an "Industrial Amber" for action.

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#022448` | Primary actions, nav active state, key UI anchors |
| `primary-container` | `#1e3a5f` | Gradient partner for primary, hover states |
| `on-primary` | `#ffffff` | Text/icons on primary backgrounds |
| `secondary` | `#a83900` | CTAs, destructive actions, high-priority chips |
| `secondary-container` | `#fc6018` | Inventory chips, warnings |
| `on-secondary-container` | `#531800` | Text on secondary-container |
| `tertiary` | `#242424` | Dark backgrounds, footer, deep surfaces |
| `surface` | `#f7f9fb` | Page background |
| `surface-container` | `#eceef0` | Default card background |
| `surface-container-low` | `#f2f4f6` | Subtle section separators |
| `surface-container-high` | `#e6e8ea` | Inset elements: search bars, secondary inputs |
| `surface-container-lowest` | `#ffffff` | "Lifted" cards, modals, floating elements |
| `on-surface` | `#191c1e` | Primary text |
| `on-surface-variant` | `#43474e` | Secondary text, body copy |
| `outline-variant` | `#c4c6cf` | Ghost borders at 15% opacity only |

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts.
- A `surface-container-low` (#f2f4f6) section should sit directly on a `surface` (#f7f9fb) background. The change in tone is the divider.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials.
- **Base Layer:** `surface` (#f7f9fb)
- **Content Cards:** `surface-container-lowest` (#ffffff) to provide a "lifted" appearance.
- **Inset Elements:** Use `surface-container-high` (#e6e8ea) for search bars or secondary inputs to create a "recessed" feel.

### The "Glass & Gradient" Rule
Floating navigation bars or modal headers use **Glassmorphism**.
- Use `primary-container` (#1e3a5f) at 85% opacity with `backdrop-filter: blur(20px)`.
- **Signature Gradients:** Primary CTAs use `linear-gradient(135deg, #022448, #1e3a5f)`. This adds a "weighted" feel that flat color lacks.

---

## 3. Typography: Editorial Authority

Font: **Inter** exclusively (already loaded).

| Style | Size | Weight | Tracking | Usage |
|-------|------|--------|----------|-------|
| Display lg | 32px | 700 | -0.02em | Hero moments: quote totals, welcome |
| Display md | 24px | 700 | -0.02em | Page titles |
| Headline lg | 20px | 600 | -0.01em | Section headers |
| Headline md | 18px | 600 | -0.01em | Card titles |
| Headline sm | 16px | 600 | 0 | Sub-section titles |
| Body lg | 16px | 400 | 0 | Primary content |
| Body md | 14px | 400 | 0 | Supporting content |
| Label md | 12px | 500 | +0.05em | Uppercase category labels |
| Label sm | 11px | 500 | +0.05em | Chips, badges, timestamps |

- Always use `on-surface` (#191c1e) for headlines.
- Use `on-surface-variant` (#43474e) for body text.
- **Labels** (service categories, status chips): UPPERCASE with +0.05em tracking.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are "dirty." Depth is achieved through atmospheric light and tonal shifts.

- **The Layering Principle:** Place `surface-container-lowest` (#ffffff) cards on `surface-container` (#eceef0) backgrounds. Contrast provides elevation without shadow.
- **Ambient Shadows:** Floating elements (FAB, dropdowns, modals) use: `box-shadow: 0 8px 32px -4px rgba(2, 36, 72, 0.08), 0 2px 8px -2px rgba(2, 36, 72, 0.05)`. Blue-tinted to mimic natural lighting from a navy sky.
- **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline-variant` (#c4c6cf) at **15% opacity**. It should be felt, not seen.
- **Glassmorphism:** Sidebar, top nav, modal headers. `background: rgba(30, 58, 95, 0.85)`, `backdrop-filter: blur(20px)`, `border: 1px solid rgba(255,255,255,0.08)`.

---

## 5. Components: Stylized Essentials

### Buttons

| Variant | Style | Use case |
|---------|-------|----------|
| Primary | `linear-gradient(135deg, #022448, #1e3a5f)`, white text, 12px radius, 24px H-pad | "Speichern", "Bestätigen", key actions |
| Secondary | `#ffffff` bg, ghost border at 15% opacity, `on-surface` text | "Hinzufügen", secondary actions |
| Tertiary | Text only, `secondary` (#a83900) color | "Bearbeiten", "Stornieren" |
| Destructive | `secondary` (#a83900) gradient, white text | Delete, cancel |
| Icon | 40px, `surface-container-high` bg, 12px radius | Toolbar actions |

Hover: all buttons shift background one tonal step up. No transform/scale effects.

### Input Fields
- Style: `surface-container-high` (#e6e8ea) background, no border, 12px radius.
- Focus: background shifts to `surface-container-lowest` (#ffffff) + 2px `primary` bottom accent only.
- Label: `on-surface-variant`, 12px, above the field.
- Never use boxed inputs with full borders.

### Cards
- Background: `surface-container-lowest` (#ffffff).
- Container background: `surface-container` (#eceef0) or `surface` (#f7f9fb).
- Radius: 16px (lg) for primary cards, 12px (md) for nested content.
- No borders. No shadows except for floating elements.
- Hover: `surface-container-low` (#f2f4f6) tonal shift.

### Data Tables
- No horizontal dividers. Use 8px vertical spacing + alternating `surface`/`surface-container-low` rows.
- Header: `surface-container-high` background, Label md uppercase.
- Row hover: `surface-container-low` shift.

### Status Badges
- Use tonal chip style: colored `*-container` bg + matching `on-*-container` text.
- All uppercase, Label sm, 8px H-pad, 4px V-pad, 8px radius.

### Sidebar
- Full glassmorphism: `rgba(2, 36, 72, 0.88)` + `backdrop-filter: blur(24px)`.
- Active nav item: `primary-container` (#1e3a5f) bg, `on-primary` text, 12px radius.
- Inactive: `on-primary` at 60% opacity.
- Logo area: Display md, white.

### Modals / Panels
- Backdrop: `rgba(2, 36, 72, 0.4)` blur overlay.
- Container: `surface-container-lowest` (#ffffff), 20px radius, ambient shadow.
- Header: Glassmorphism strip — `rgba(30, 58, 95, 0.85)` + blur(20px), white title text.

### Specialized Logistics Components
- **"Load Progress" Bar:** `primary-fixed` (#d5e3ff) track, `secondary` (#a83900) fill. Shows truck capacity.
- **Inventory Chips:** `secondary-container` (#fc6018) bg, `on-secondary-container` (#531800) text. High-priority items (Fragile).
- **Conflict / Alert Badges:** Keep semantic reds/ambers but layer them as tonal chips, not bordered boxes.

---

## 6. Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps between related inline elements |
| `space-2` | 8px | List item separation, chip padding |
| `space-3` | 12px | Input padding, small card padding |
| `space-4` | 16px | Standard section padding |
| `space-5` | 20px | Card padding, modal padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Large section separators |
| `space-10` | 40px | Page-level padding |

**Rule:** When in doubt, go one level up.

---

## 7. Motion & Interaction

- **Transitions:** `150ms ease-out` for state changes (hover, focus, active).
- **Panel slides:** `300ms cubic-bezier(0.4, 0, 0.2, 1)` — the Material standard easing.
- **No bounces.** No spring physics. Precision, not playfulness.
- **Skeleton loaders** instead of spinners for data fetching.

---

## 8. Do's and Don'ts

### Do
- Use **Negative Space** as a functional element. If in doubt, increase spacing by one level.
- Use **Asymmetric Alignment**: text left, secondary CTAs pull right for dynamic flow.
- Use **Tonal Transitions** for state changes (hover shifts card from `surface-container-lowest` to `surface-container-low`).
- Use glassmorphism for the sidebar, top bars, and modal headers.

### Don't
- **Don't use pure black.** Use `on-surface` (#191c1e) for text, `tertiary` (#242424) for dark backgrounds.
- **Don't use sharp corners.** Minimum 12px radius everywhere.
- **Don't use 1px solid borders** for layout separation. Only `outline-variant` at 15% opacity as accessibility fallback.
- **Don't use neumorphic inset/outset shadows.** Replace with tonal layering.
- **Don't use spinner loaders.** Use skeleton screens.
- **Don't animate with scale/transform bounces.** Keep motion precise and directional.
