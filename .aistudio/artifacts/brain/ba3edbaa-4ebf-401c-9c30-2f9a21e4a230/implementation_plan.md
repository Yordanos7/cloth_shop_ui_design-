# Maison Verrel — "The Rail" Boutique Hero

A single-screen, zero-vertical-scroll luxury fashion storefront hero for **Maison Verrel**, built as a React and TypeScript port that reproduces the exact `--u` proportional layout, curved brass clothing rail, CSS-cropped product sheets, damped-spring pendulum physics, quick-view choreography, arc fly-to-bag animation, and slide-over cart drawer.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Confirmed Phase 1 choices override conflicting delivery defaults while preserving every visual, geometric, and physics requirement from the specification.

- **Confirmed Decision 1 — React & TypeScript Architecture**: Delivered as a clean React + TypeScript application styled with Tailwind CSS and precision CSS variables (`--u` design unit), rather than a single raw HTML file.
- **Confirmed Decision 2 — Secondary Controls & Inline Checkout**: Clicking **"Shop the Collection"** opens the quick-view on the currently focused (or first visible) garment, and clicking **"Checkout"** inside the cart drawer transitions inline to an order confirmation receipt summary without leaving the screen. Secondary navigation/utility links and the Search pill provide quiet, non-intrusive interactions (e.g., Search jumps/highlights matching garments on the rail; utility/nav links show subtle inline editorial notices).

---

## 1. Overview & Core Concept

- **What It Does**: Presents an interactive, full-viewport ivory boutique stage where 20 garments (8 distinct silhouettes across tailored blazers, belted trenches, silk slips, and a satin gown) hang side-on from dark wooden hangers along a curved gold rail. Visitors scroll or drag horizontally with inertia, watch garments sway on their hooks, hover to rotate pieces face-forward while neighbors part aside, inspect Front/Back views in a full-screen quick-view, fly selected sizes directly into the nav bag icon, and manage quantities or complete an inline checkout in a slide-over cart drawer.
- **Target Audience**: Luxury fashion shoppers on desktop (`1440×900` reference frame) and touch devices (`≤ 820px` tablet/phone breakpoints) expecting editorial calm and tactile physical motion.
- **Key Value**: Combines sub-pixel geometric fidelity with responsive 60fps spring physics and zero-latency asset cropping from three preloaded transparent WebP sprite sheets.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Preload & Staggered Intro Sequence**:
   - The `is-loading` guard hides garments, headline words, and footer until both fonts and the `side` + `front` product sheets finish decoding (with a `2.5s` failsafe).
   - Once ready, the 20 garments drop onto their hooks left-to-right (`620ms`, `i × 70ms` stagger) with alternating pendulum impulses (`±1.6`), while the headline sharpens word-by-word from blur and the footer fades in.
2. **Horizontal Rail Exploration (Wheel, Drag, Keyboard)**:
   - Wheel events anywhere on the stage (when quick-view is closed), pointer drag on the rail zone (with `6px` threshold and release fling), and `ArrowLeft`/`ArrowRight` keys smoothly update the target scroll position.
   - Each garment pivots around its hook (`0 0`) via a damped spring driven by scroll velocity, while the centered bottom progress thumb tracks scroll progress (`0%` to `42%` left offset).
3. **Hover & Touch Inspection**:
   - Mouse hover lifts the garment (`12u` down, `1.2×` scale), rotates the side face `0° → -90°` then reveals the front face `90° → 0°`, parts neighboring garments (`±50u, 24u, 9u`), and crossfades the bottom-left hint into the garment name and `$690.00` price.
   - Touch devices (`hover: none`) display `"Tap a piece · tap again to look closer"`, turning on the first tap and opening quick-view on the second.
4. **Full-Screen Quick-View & Fly-to-Bag**:
   - Clicking a garment blurs and fades the stage, hangs the piece from a `1.5px` dark vertical rod at `0.9u` scale (desktop) or fitted upper space (mobile), and flies it smoothly from its exact rail coordinates into place.
   - Users toggle **Front** / **Back** views, select size (`S`, `M`, `L`, `XL`), or click **View product page** / **Shop the Collection**.
   - Clicking **Add to cart** shows a `1000ms` `"Adding…"` spinner, closes quick-view while dropping the rail piece back onto its hook, and launches a fixed visual clone along a parabolic upward arc (`-90u` apex) into the nav bag icon, popping the badge count and bouncing the bag without auto-opening the drawer.
5. **Slide-Over Cart Drawer & Inline Checkout**:
   - Clicking the bag icon slides in the `560u` drawer from the right while shifting the `.page` stage `560u` left on desktop (recomputing rail width live every frame, collapsing the search pill to `40u`, and nudging nav links `+24u`).
   - Starts pre-populated with **Taupe Wool Blazer (M)**, **Champagne Bias Slip (S)**, and **Ivory Belted Trench (M)** (badge starts at `3`).
   - Steppers (`−`/`+`) and trash buttons update line totals, subtotal, and badge live; clicking **Checkout** displays a clean inline order confirmation inside the drawer with a return-to-boutique reset.

### Visual Identity & Theme

- **Aesthetic Direction**: Calm, warm-ivory Parisian atelier studio with hairline architectural structure and restrained luxury typography.
- **Color Palette & Tokens**:
  - Canvas background: `#FAF7F2` (`--bg`)
  - Utility bar & soft surfaces: `#EFEBE4` (`--utility`)
  - Primary ink: `#1A1716` (`--ink`) and near-black CTAs/badges `#0E0D0C`
  - Muted metadata & dividers: `#746A5E` (`--muted`), `#DDD5C9` (`--hairline`), `#EDE8DF` (`--search-pill`), `#F6F1E7` (`--tag`)
  - Rail gold gradient: `#E9DCBC` → `#C2A877` (45%) → `#7F6743` with soft drop shadow and crisp top highlight.
- **Typography & Hierarchy**:
  - Wordmark only: `Cormorant Garamond` (500 weight, `23.6u` desktop / `20u` mobile, `0.075em` tracking).
  - UI, Display Headline & Metadata: `Inter` variable (`100–900` weights) with tabular numerals (`tabular-nums`) for prices and quantities; headline words step down in luminance from `#141210` to a `#A6968A → #C6B8A9` clipped gradient on `"right."`.
- **Responsive & Reduced Motion**:
  - Desktop (`> 820px`): `u = min(innerWidth / 1440, innerHeight / 900)`, `rail-top: 270`, `rail-sag: 74`, `gap: 121`, `gs: 0.455`, `start: 113`.
  - Phone/Tablet (`≤ 820px`): `u = min(innerWidth / 390, innerHeight / 780)`, `rail-top: 292`, `rail-sag: 30`, `gap: 80`, `gs: 0.30`, `start: 46`; two-line headline, bottom-pinned quick-view info panel (`94%` backdrop tint), full-width drawer without stage shift.
  - `prefers-reduced-motion: reduce`: eliminates transitions/sway, skips intro drop, and makes quick-view/add-to-cart instant.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Imperative `requestAnimationFrame` Physics Loop with React State Sync**
  - *Chosen Approach*: Keep high-frequency 60fps scroll interpolation (`cur`, `vel`), per-garment spring angles (`a`, `av`), neighbor spacing offsets, and live SVG rail curve redraws inside refs updated by a single `requestAnimationFrame` loop, while React state manages discrete UI states (active quick-view item, selected view/size, adding state, search query/filter, cart items, drawer open state, and inline checkout receipt).
  - *Why*: Updating 20 DOM transforms and an SVG quadratic curve on every frame directly via refs avoids React reconciliation overhead and guarantees silk-smooth inertia, pendulum sway, and responsive drawer-shift redraws at 60fps+.
  - *Alternatives Considered*: Driving frame-by-frame coordinates through React state or Framer Motion springs on 20 separate nodes, which risks frame drops during rapid drag flings and drawer width transitions.
- **Decision 2 — Exact CSS Sprite Cropping from Preloaded Product Sheets**
  - *Chosen Approach*: Preload the three `images.higgs.ai` WebP product sheets (`side`, `front`, `back`) as `Image()` objects with `decode()` promises, and render every rail garment, quick-view face, fly-to-bag clone, and cart thumbnail using CSS `background-image`, `background-size`, and `background-position` computed from the measured `[y, h, hookX]` crop table scaled by `s`.
  - *Why*: Preserves exact hook registration (`left: -170 * s`, `top: 0`), avoids duplicating or slicing image assets, and ensures zero flicker when turning from side to front or toggling Front/Back in quick-view.
  - *Alternatives Considered*: Canvas slicing or separate image requests per garment, which would introduce network latency and alignment drift.
- **Decision 3 — Token-Guarded Web Animations API (WAAPI) Choreography**
  - *Chosen Approach*: Use native `Element.animate()` for the staggered drop-in intro, quick-view fly-in/reverse-flight, and parabolic fly-to-bag clone, guarded by an incrementing `qvToken` and reduced-motion checks.
  - *Why*: Supports exact cubic-bezier curves, mid-flight keyframe arcs (`45%` offset `-90u`), instant cancellation on rapid switching, and guarantees a stale close animation never hides a newly opened garment.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Hierarchy

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ App Root (Preload Manager, --u Viewport Scaler, Global Cart & UI State)  │
└──────┬───────────────────────────────┬───────────────────────────────┬───┘
       │                               │                               │
       ▼                               ▼                               ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│ .page / .stage      │      │ .qv QuickView Layer │      │ aside.drawer     │
│ (Shifts right: 560u │      │ (Token-guarded WAAPI│      │ (560u desktop /  │
│  when drawer open)  │      │  fly-in & return)   │      │  100% mobile)    │
├─────────────────────┤      ├─────────────────────┤      ├──────────────────┤
│ • UtilityBar        │      │ • Vertical 1.5px Rod│      │ • Header + Chip  │
│ • NavRow (Wordmark, │      │ • Cropped Face Pair │      │ • Item Rows      │
│   Links, Search,    │      │   (Front / Back)    │      │   (Thumb, Size,  │
│   Account, Bag+3)   │      │ • Staggered Info Col│      │    −/+ Stepper,  │
│ • Eyebrow & Headline│      │   (Counter, Name,   │      │    Trash, Total) │
│ • RailStage (rAF)   │      │    Tabs, Sizes,     │      │ • Footer Subtotal│
│   ├─ Curved Gold SVG│      │    Add to Cart CTA, │      │   & Inline       │
│   └─ 20 GarmentRig  │      │    Product Meta)    │      │   Checkout Flow  │
│ • Footer (Hint /    │      │ • Close × Button    │      └──────────────────┘
│   Hover Label,      │      └─────────────────────┘
│   Progress, Copy +  │
│   Shop Collection)  │
└─────────────────────┘
```

### Data Model & State

- **Catalog & Crop Registry**: Static typed definitions for the 8 base garments (`k = 0..7`: name, `$690` price, and `[y, h, hookX]` tuples for `side`, `front`, `back`) plus the exact 20-piece rail sequence `[0, 1, 2, 3, 4, 0, 5, 6, 7, 0, 4, 1, 2, 3, 5, 6, 7, 1, 4, 3]` and repeating tag tilt angles.
- **Cart State**: Array of `{ id, k, size, qty }` initialized with Taupe Wool Blazer (`M`), Champagne Bias Slip (`S`), and Ivory Belted Trench (`M`), deriving total badge count and formatted USD subtotal (`$2,070.00` initial) live.
- **Physics Refs (Mutable, Non-React)**: Scroll `target`, `cur`, `vel`, drag tracking (`down`, `moved`, `startX`, `startTarget`, `lastX`, `lastT`, `releaseVel`), per-garment `[angle, angularVel, currentOffset]` arrays, and `hoveredIndex`.

### Interactive Component & State Mapping

- **Search Pill**: Expands an inline minimal search input inside the `#EDE8DF` pill (desktop) to filter or jump smoothly to the matching garment on the rail when submitted, and collapses to a `40u` circle when the cart drawer shifts the page.
- **Shop the Collection**: Smoothly opens Quick-View for the garment currently centered in the viewport (or piece `0` at start).
- **Add to Cart**: Disables button into `"Adding…"` spinner for `1000ms`, clones the active Quick-View face rect into a fixed fly-layer, closes Quick-View with a `260ms`-delayed rail drop + `+1.4` sway nudge, animates the parabolic arc to the bag icon's center, inserts/increments the item at the top of the cart, and triggers badge pop + bag bounce.
- **Checkout**: Validates non-empty cart, transitions the drawer body into a calm inline confirmation view showing order reference, itemized summary, and a `"Continue browsing"` button that resets the drawer view.
