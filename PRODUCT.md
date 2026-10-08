# Product

<!-- impeccable:product-schema 1 -->

> Written by `impeccable init` in a non-interactive session. No question tool was available, so every fact below is taken from `PORTFOLIO_BRIEF.md` (source of truth) and `PLAN.md`. Items marked *(inferred)* are reasonable readings of the brief, not confirmed answers. Items marked *(open)* are undecided.

## Platform

web

## Stack

Decided in the brief (section 5) and PLAN.md section 1:

- `/FE`: React 19 + Vite, JavaScript only (no TypeScript), SCSS (no Tailwind), React Router (multi page), framer-motion, Three.js via `@react-three/fiber` + `@react-three/drei` (Home hero only, lazy loaded), EmailJS for the contact form.
- `/BE`: Node + Express on port 4000, PostgreSQL, MinIO for images, sharp resizing to webp (1600px + 600px thumb).
- Hosting: one AWS EC2 box, Docker Compose (caddy, api, postgres, minio). Caddy serves the FE build at `jose.web.id`, proxies `/api/*` to the API and `/media/*` to MinIO.

## Users

- **Primary** *(inferred)*: recruiters, hiring managers and potential clients evaluating Jose as a project manager and fullstack developer. They arrive from a CV, LinkedIn or GitHub link, scan quickly, and want proof: shipped products, experience, stack, a CV download and a way to get in touch.
- **Secondary** *(inferred)*: people interested in his creative work (video edits, photoshoots, writing) who browse the Works feed.
- **Owner**: Jose himself, publishing Works posts through the hidden `/admin` page (single admin).

## Product Purpose

A personal portfolio and publishing site for Jose Andreas Lie at `jose.web.id`. It presents who he is (bio, skills, experience, education, CV), what he has built (Projects, Live Products), and an ongoing Works feed he manages through his own backend. Success: a visitor understands within seconds that he is an engineer who also shoots, can verify that through real shipped products and work, and can contact him.

## Positioning

"Signal & Frame": an engineer who also shoots. Systems precision plus a camera eye. Every piece of work is presented as a "frame", and its metadata reads like camera EXIF or log lines. The combination of shipped production software (including a live, confidential money ledger in client use) and a self-run media feed with its own backend is what a generic developer portfolio cannot claim.

## Operating Context

- Routes (PLAN.md 2.1): `/` Home, `/about`, `/projects`, `/products`, `/products/:slug`, `/works`, `/works/:slug`, `/contact`, hidden `/admin` (not in nav, `noindex`), `*` 404.
- Works feed types: Video (editing), Photo (photoshoots), Project, Writing. Each post: title, type, date, cover image, summary, markdown body, gallery or video embed, tags, optional gear ("shot on"), links.
- Video is embedded from YouTube or Vimeo only, never uploaded. Photos are uploaded via admin and resized to webp.
- Admin workflow: login with single password, list works (drafts included), create/edit/delete, upload images, toggle publish. Admin is an Operate surface: plain, fast, no hero motion.
- Contact goes through EmailJS. Contact email: jose.lie2208@gmail.com. Socials: GitHub, Instagram, LinkedIn, all `@joseandreaslie`. Location: Indonesia.

## Capabilities and Constraints

- Dark and light themes with a toggle.
- Heavy animation is wanted, but `prefers-reduced-motion` must always be respected.
- Three.js only in the Home hero, lazy loaded, with a static fallback on mobile (`<768px`), reduced motion, or no WebGL.
- Live Products:
  - **Splitter** (`splitter.jose.web.id`): expense splitter for groups. Show public link, desktop + mobile screenshots, stack, short write up.
  - **Badminton** (`badminton.jose.web.id`): badminton matchmaking. Same treatment as Splitter.
  - **Echo**: money ledger for money related business operations. CONFIDENTIAL, in production with a client using real data. Case study only (problem, architecture, stack, role). Badge: "Private · in production". Screenshots use mock data only. Never show its URL, client name, or any real data anywhere: site, screenshots, alt text, mocks, commits, repo.
- Not now: multi user, comments, rich text editor.
- Title line (confirmed by Jose): "Project Manager / Fullstack Developer", rendered as `Project Manager · Fullstack Developer`.

## Brand Commitments

- Name: Jose Andreas Lie. Monogram: JAL.
- Brand v2 "Signal & Frame" (brief section 4) is the visual identity; see `DESIGN.md`. Copper accent from the previous site is retired.
- Copy rules: no gradient backgrounds anywhere; no random dashes (`-` or `—`) used as decoration or in copy. Use the middle dot `·` for meta separators, as in the brief.
- Voice *(inferred from the brief's tone)*: plain, confident, factual. Short sentences. Let shipped work carry the claims.

## Evidence on Hand

- CV: `FE/public/CV_JoseAndreasLie.pdf` (bio, experience, education source).
- Projects source: `JoseAndreasLie'sPortfolio.pdf` at repo root.
- Existing content data: `FE/src/data/portfolio.js` (to be corrected against the CV).
- Live products: Splitter and Badminton public URLs above.
- **Absent, must not be fabricated**: work stills (8 to 12 promised, min 1600px), Splitter and Badminton screenshots, Echo mock screenshots, profile photo (none, by choice), testimonials (none, by choice). Until supplied, placeholders are neutral frames with the viewfinder motif, never stock photos.

## Product Principles

1. **Proof over adjectives.** Shipped products, real works and the CV do the persuading; copy stays short and factual.
2. **The work leads.** On Home, Works and product pages the frames are the content and the interface recedes around them.
3. **Confidentiality is absolute.** Echo is shown as a case study only; nothing identifying ever leaves the owner's head.
4. **Owner can publish without a developer.** The Works feed must stay easy to maintain from `/admin`.
5. **Motion is expressive, never mandatory.** Every animated moment has a still, reduced motion equivalent.

## Accessibility & Inclusion

- `prefers-reduced-motion` respected everywhere (CSS and framer `useReducedMotion`).
- Targets from PLAN.md T3.2: Lighthouse accessibility at least 90, text contrast 4.5:1 in both themes, full keyboard navigation, no horizontal scroll at 375px, CLS under 0.1.
- Contact and admin forms use visible labels and inline errors.
