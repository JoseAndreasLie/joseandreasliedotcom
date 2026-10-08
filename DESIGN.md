---
name: Jose Andreas Lie
description: Signal & Frame. An engineer who also shoots.
colors:
  ink: "#0B0B0C"
  graphite: "#1A1A1C"
  paper: "#EEECE7"
  ash: "#8C8A85"
  smoke: "#66645F"
  signal: "#E5482D"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
  display-accent:
    fontFamily: "Newsreader, Georgia, serif"
    fontStyle: italic
  body:
    fontFamily: "'Schibsted Grotesk', system-ui, sans-serif"
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    textTransform: uppercase
    letterSpacing: "0.12em"
    fontSize: "0.75rem"
---

# Design System: Jose Andreas Lie

> Seed DESIGN.md written by `impeccable init` (T1.1) from `PORTFOLIO_BRIEF.md` section 4, "Brand v2: Signal & Frame", and PLAN.md sections 2.4 and 2.5. Everything marked **Brief** is verbatim and locked. Everything marked **Provisional** is a minimal build default added so T1.2 can implement; it is not a new aesthetic direction, and the later `impeccable document` pass (after T1.2) replaces it with what actually shipped.

## Overview

**Creative North Star: "Signal & Frame"** (Brief)

> Idea: an engineer who also shoots. Systems precision + camera eye. Every work is a "frame", meta reads like camera EXIF / log lines.

Style vibe: minimal, full rebrand (Brief). Dark and light themes with a toggle (Brief). Multi page with routing (Brief). Heavy animation, respecting reduced motion (Brief).

Mode for the public site: **Experience**. The visitor is inside the work; frames lead, the interface recedes. The hidden `/admin` is **Operate**: plain, fast, no hero motion.

**Key Characteristics:**
- Flat palette, no gradients anywhere.
- One accent, Signal red, used like a camera's REC light: rare and meaningful.
- Camera vocabulary as UI: viewfinder corner brackets, frame counters, EXIF style meta rows, 1px hairline rules.
- Editorial serif display against a precise grotesk body and a tracked mono for metadata.

## Colors

Palette (flat, no gradients) (Brief):

### Primary
- **Signal** (`#E5482D`): REC light red. Accent only, **max about 10% of any screen**. REC dot, logo dot, focus point in the hero, active nav marker, primary action, focus rings.

### Neutral
- **Ink** (`#0B0B0C`): dark theme background.
- **Graphite** (`#1A1A1C`): dark theme surface.
- **Paper** (`#EEECE7`): light theme background.
- **Ash** (`#8C8A85`): dim text in dark theme, hairline rules in both themes.
- **Smoke** (`#66645F`): dim text in light theme. A darker Ash (same warm hue) that holds 5.01:1 on Paper. Confirmed by Jose.

**Light theme swaps Ink and Paper. Copper accent retired.** (Brief)

### Tokens (PLAN.md 2.4)

Raw tokens, defined once on `:root` in `FE/src/styles/_tokens.scss`:

```scss
:root {
  --ink: #0B0B0C;
  --graphite: #1A1A1C;
  --paper: #EEECE7;
  --ash: #8C8A85;
  --smoke: #66645F;
  --signal: #E5482D;
}
```

Semantic tokens, switched by `[data-theme]` on `<html>` (already set by `FE/src/context/ThemeContext.jsx`, default `dark`):

| Token | Dark (`[data-theme='dark']`, default) | Light (`[data-theme='light']`) | Source |
|---|---|---|---|
| `--bg` | `var(--ink)` | `var(--paper)` | Brief |
| `--text` | `var(--paper)` | `var(--ink)` | Brief (swap) |
| `--surface` | `var(--graphite)` | `var(--paper)` | Dark: Brief. Light: **Provisional**, see open item 1 |
| `--text-dim` | `var(--ash)` | `var(--smoke)` | Dark: Brief. Light: Confirmed (Smoke) |
| `--accent` | `var(--signal)` | `var(--signal)` | Brief |
| `--rule` | `var(--ash)` | `var(--ash)` | Confirmed |

Measured contrast (WCAG):

| Pair | Ratio | Verdict |
|---|---|---|
| Paper on Ink | 16.66 | text OK |
| Paper on Graphite | 14.72 | text OK |
| Ash on Ink | 5.70 | text OK |
| Ash on Graphite | 5.04 | text OK |
| Signal on Ink | 4.96 | text OK |
| Signal on Graphite | 4.38 | large text / UI only |
| Ink on Paper | 16.66 | text OK |
| Graphite on Paper | 14.72 | text OK |
| Signal on Paper | 3.36 | large text / UI only |
| Smoke on Paper | 5.01 | text OK |
| **Ash on Paper** | **2.92** | **fails for any text** (rules only) |

### Open items (not decided here; brief is silent)
1. **Light `--surface`.** The brief swaps Ink and Paper but gives Graphite no light counterpart. Provisional: light surfaces stay Paper and are separated by `--rule` hairlines, not by a fill. No new colors introduced.

### Named Rules
**The REC Light Rule.** Signal is at most about 10% of any screen (Brief). It marks what is live, active or focused. Never a background fill for a section, never decorative.

**The Flat Rule.** No gradients: no gradient backgrounds, gradient text, or gradient borders (Brief, section 7).

**The Six Colors Rule.** Every color on the site is one of Ink, Graphite, Paper, Ash, Smoke, Signal (Smoke is a darker Ash for light theme dim text). Opacity variants are not new colors and should be avoided for text.

## Typography

Type (Google Fonts) (Brief):

**Display Font:** Newsreader (italic for accents), fallback Georgia, serif
**Body Font:** Schibsted Grotesk, fallback system-ui, sans-serif
**Label/Mono Font:** JetBrains Mono, **uppercase, tracked, small**, fallback ui-monospace, monospace

**Character:** an editorial serif with an italic voice for emphasis, a precise grotesk for reading, and a log-line mono for every piece of metadata.

Load all three from Google Fonts in `FE/index.html` with `display=swap` and `preconnect`. Provisional weights: Newsreader 400 and 400 italic (add 500 only if needed), Schibsted Grotesk 400, 500, 600, JetBrains Mono 400, 500.

### Hierarchy (Provisional sizes; families are Brief)
- **Display** (Newsreader 400, `clamp(2.75rem, 7vw, 6rem)`, line-height 1.0): page titles, hero name. Italic for the accented word.
- **Headline** (Newsreader 400, `clamp(1.75rem, 3.5vw, 2.75rem)`, 1.1): section titles.
- **Title** (Schibsted Grotesk 600, 1.25rem, 1.3): card titles, product names.
- **Body** (Schibsted Grotesk 400, 1rem to 1.125rem, 1.6): prose, max 68ch.
- **Label** (JetBrains Mono 400 to 500, 0.75rem, letter-spacing 0.12em, uppercase): MetaRow, FrameCounter, nav items, tags, badges, button text, form labels.

### Named Rules
**The Log Line Rule.** All metadata (dates, types, gear, counts, status) is set in the mono label style and separated with ` · ` (middle dot with spaces), never dashes. Example: `2026 · VIDEO · SONY FX3`.

**The No Dash Rule.** No `-` or `—` as decoration or in copy (Brief, section 7). Use `·` for separators and `/` for counters and ranges (`FR 012 / 040`), or rewrite the sentence.

## Layout

Multi page with routing (Brief). Routes per PLAN.md 2.1.

Provisional defaults for T1.2:
- Content container max width about 1200px, side gutter 16px on phones growing to about 48px on desktop. No horizontal scroll at 375px.
- Spacing on a 4px base (4, 8, 12, 16, 24, 32, 48, 64, 96, 128) exposed as `--space-*`.
- Breakpoints: 768px (hero switches to static fallback below this, per PLAN.md T2.2) and 1024px.
- Sections separated by 1px hairline `Rule`s and generous vertical space, not by background fills.

## Elevation & Depth

Flat. No shadows on cards or surfaces (follows from "flat, no gradients" and the minimal vibe; Provisional as an explicit rule). Depth is conveyed by hairline rules, the Graphite surface in dark theme, and real spatial depth only inside the Three.js hero (contact sheet planes in depth).

## Shapes

- **Viewfinder corners** on media cards (Brief): four L shaped corner brackets drawn at the corners of a frame, not a full border. Provisional: 1px stroke in `--text`, arm length about 12 to 16px; Signal only for the focused or active frame.
- **Hairline 1px rules** (Brief).
- Provisional: square corners (radius 0) on frames, cards, buttons and inputs, to match the viewfinder and hairline language. Pills and rounded cards are out.

## Motion

Motion (Brief): **shutter wipe page transitions, REC dot pulse, cursor drift on hero.** Heavy animation is wanted; **reduced motion is always respected** (Brief).

Tokens (PLAN.md 2.4):

```scss
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --dur-fast: 150ms;    // UI micro feedback
  --dur-base: 200ms;    // UI default
  --dur-slow: 250ms;    // UI upper bound
  --dur-shutter: 500ms; // page shutter wipe
}
```

- UI transitions: 150 to 250ms, `--ease-out`.
- Page shutter wipe: about 500ms, `--ease-in-out`, framer-motion in `PageTransition`.
- REC dot pulse: slow opacity/scale pulse on the Signal dot.
- Hero cursor drift: spring based (T2.2).
- **Reduced motion:** under `prefers-reduced-motion: reduce` (CSS) and framer `useReducedMotion()` (JS): shutter wipe becomes an instant swap or a short opacity fade, REC dot stops pulsing and stays solid, hero shows the static fallback, no parallax or drift.
- Animate only `transform` and `opacity`.

## Components

Shared primitives (PLAN.md 2.5). T1.2 builds them in `FE/src/components/ui/`; pages only import them.

| Primitive | Purpose and spec |
|---|---|
| `Viewfinder` | Wrapper that draws viewfinder corner brackets around its children (media, placeholders). Props for active state (Signal corners). |
| `MetaRow` | EXIF style meta line in mono label style, items joined by ` · `. Example `2026 · VIDEO · SONY FX3`. |
| `FrameCounter` | Frame index readout, mono label style. Format `FR 012 / 040` (zero padded to 3). |
| `RecDot` | Small Signal dot that pulses (REC light). Static under reduced motion. Used in logo, hero, Echo badge or live states. |
| `Rule` | 1px hairline divider in `--rule`. |
| `Logo` | "JAL" monogram inside viewfinder corner brackets + small Signal dot (REC). SVG, also used as favicon (Brief). |
| `PageTransition` | Shutter wipe between routes, about 500ms, `--ease-in-out`; reduced motion fallback as above. |
| `MediaCard` | Works / product card: cover inside `Viewfinder`, `FrameCounter`, title, `MetaRow`. |
| `Section` | Page section wrapper: container, vertical rhythm, optional mono label heading and top `Rule`. |
| `Button` | Mono label text, square corners, 1px border in `--text`. Primary variant uses Signal. Visible focus ring in Signal. |
| `api.js` | `getWorks`, `getWork`, admin calls; mock fallback when the API is unreachable in dev. (Not visual.) |

Other component notes:
- **Echo badge:** text `Private · in production` (Brief), mono label style, may carry a `RecDot`.
- **Placeholders:** neutral frames with the Viewfinder motif, never stock photos (PLAN.md section 5).
- **Navbar / Footer:** restyled to this system in T1.2; `/admin` never appears in nav.

## Do's and Don'ts

**Do**
- Use only Ink, Graphite, Paper, Ash, Smoke, Signal.
- Keep Signal to about 10% of a screen or less.
- Set all metadata in JetBrains Mono, uppercase, tracked, small, separated by `·`.
- Use Newsreader italic for the accented word in a display line.
- Frame media with viewfinder corners and separate sections with 1px hairlines.
- Provide a still equivalent for every motion under reduced motion.
- Keep text at 4.5:1 contrast in both themes (Ash on Paper is for rules only; light dim text uses Smoke).

**Don't**
- No gradients of any kind (backgrounds, text, borders).
- No `-` or `—` as decoration or in copy.
- No Copper accent (retired).
- No stock photos; placeholders are neutral viewfinder frames.
- No Echo URL, client name, or real data anywhere: copy, alt text, mock data, screenshots, filenames, commits.
- No hero motion or decorative animation on `/admin`.
