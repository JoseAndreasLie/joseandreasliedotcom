# PLAN.md: jose.web.id build plan

Source of truth for scope: `PORTFOLIO_BRIEF.md`. This file is for coordinating subagents: who owns what, in what order, against which contracts. When the brief and this plan conflict, the brief wins; flag it, don't guess.

## 0. Ground rules for every agent

- **Own your files only.** Each task lists the paths it may create/edit. Touching another task's paths = stop and report to the orchestrator.
- **Contracts are frozen** once Phase 1 lands (section 2). Changing one needs the orchestrator to update this file first.
- **Brand v2 is locked.** Palette, fonts, motifs from brief section 4. No gradients, no random dashes (`-`/`—` as decoration or in copy), Signal red at most about 10% of a screen.
- **Echo is confidential.** Never write its URL, client name, or real data anywhere (code, mocks, commits, alt text). Mock data only.
- **Reduced motion respected everywhere** (`prefers-reduced-motion`, framer `useReducedMotion`).
- **JS only** (no TypeScript), SCSS (no Tailwind), React Router, framer-motion. New deps only if listed in a task.
- Before finishing: `npm run build` and `npm run lint` pass in your package; report what you verified and what you didn't.
- Mark progress by ticking the checkbox of your task in this file (only your own line).

## 1. Target architecture

```
/                     PORTFOLIO_BRIEF.md, PLAN.md, PRODUCT.md, DESIGN.md, docker-compose.yml, Caddyfile, deploy.sh, .env.example
/FE                   React 19 + Vite, SCSS, Router, framer-motion, R3F (hero only), EmailJS
/BE                   Node + Express on :4000, PostgreSQL, MinIO, sharp
```

Production (one EC2 box, Docker Compose):

| Service | Role |
|---|---|
| `caddy` | HTTPS for jose.web.id. Serves `FE/dist` (SPA fallback `try_files {path} /index.html`). `/api/*` to `api:4000`. `/media/*` to `minio:9000/works/*` |
| `api` | Express, `/BE` |
| `postgres` | DB, schema auto-applied from `BE/db/schema.sql` via `docker-entrypoint-initdb.d` |
| `minio` | Image storage, bucket `works`, public read |

FE always calls relative `/api/...` and `/media/...`. Dev: Vite proxies `/api` to `localhost:4000` (already in `FE/vite.config.js`); add `/media` proxy to `localhost:9000/works`.

## 2. Contracts (frozen after Phase 1)

### 2.1 Routes (FE)

| Path | Page | Content |
|---|---|---|
| `/` | Home | Three.js hero (contact sheet), intro, featured works, featured products |
| `/about` | About | Bio, skills/tech stack, experience, education, CV download |
| `/projects` | Projects | Projects from `JoseAndreasLie'sPortfolio.pdf` |
| `/products` | Live Products | Splitter, Badminton, Echo cards |
| `/products/:slug` | Product detail | Splitter/Badminton write up + screenshots; Echo case study (problem, architecture, stack, role, badge "Private · in production") |
| `/works` | Works feed | Filter by type (video/photo/project/writing), from API |
| `/works/:slug` | Work detail | Markdown body, gallery or video embed, meta row, links |
| `/contact` | Contact | EmailJS form |
| `/admin` | Admin (hidden, not in nav, `noindex`) | Login, works list, post form, upload |
| `*` | 404 | |

### 2.2 API (BE), base `/api`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | none | `{ ok: true }` |
| GET | `/api/works?type=` | none | published only, newest `date` first, list fields (no `body`) |
| GET | `/api/works/:slug` | none | published only, 404 otherwise |
| GET | `/api/admin/works` | JWT | all incl. drafts (admin list) |
| POST | `/api/login` | none | `{ password }` to `{ token }`, rate limited (5/15min/IP) |
| POST | `/api/works` | JWT | create, returns row |
| PUT | `/api/works/:id` | JWT | update, returns row |
| DELETE | `/api/works/:id` | JWT | 204 |
| POST | `/api/upload` | JWT | multipart `file` (image, max 20MB) to `{ url, thumb_url }`, webp 1600px + 600px |

Errors: `{ error: "message" }` with proper status. JWT: `Authorization: Bearer <token>`, 7d expiry.

### 2.3 Work object

```json
{
  "id": 1, "slug": "lombok-film", "type": "video|photo|project|writing",
  "title": "", "summary": "", "body": "markdown",
  "cover_url": "/media/abc.webp",
  "media": [{ "kind": "image", "url": "/media/x.webp", "thumb_url": "/media/x_thumb.webp", "alt": "" }
            | { "kind": "embed", "url": "https://www.youtube.com/embed/..." }],
  "links": [{ "label": "", "url": "" }],
  "tags": [""], "shot_on": "SONY FX3", "date": "2026-01-31",
  "published": true, "created_at": "ISO"
}
```

Video only via YouTube/Vimeo embed URL (validate host on BE).

### 2.4 Design tokens (owned by Phase 1, consumed by all)

`FE/src/styles/_tokens.scss` + CSS custom properties on `:root` / `[data-theme]`:
`--ink #0B0B0C`, `--graphite #1A1A1C`, `--paper #EEECE7`, `--ash #8C8A85`, `--signal #E5482D`; semantic `--bg --surface --text --text-dim --accent --rule`. Light theme swaps ink/paper.
Fonts: Newsreader (display, italic accents), Schibsted Grotesk (body), JetBrains Mono (meta, uppercase, tracked, small).
Motion: `--ease-out cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out cubic-bezier(0.77,0,0.175,1)`; UI 150 to 250ms; page shutter wipe about 500ms.

### 2.5 Shared FE primitives (Phase 1 builds, pages only import)

`Viewfinder` (corner brackets wrapper), `MetaRow` (`2026 · VIDEO · SONY FX3`), `FrameCounter` (`FR 012 / 040`), `RecDot` (pulsing Signal dot), `Rule` (1px hairline), `Logo` (JAL monogram SVG), `PageTransition` (shutter wipe), `MediaCard`, `Section`, `Button`, `api.js` (`getWorks`, `getWork`, admin calls; mock fallback when API unreachable in dev).

## 3. Phases and tasks

Legend: **[seq]** must run alone, **[par]** can run in parallel with other [par] tasks of the same phase.

### Phase 1: Foundations (blocks everything)

- [x] **T1.1 Product + design context** [seq] · owns `PRODUCT.md`, `DESIGN.md`
  Skill: `impeccable` (`init` from brief, then `document` after T1.2). Mode: Experience (portfolio). Encode brief section 4 verbatim; no new aesthetic decisions.
- [x] **T1.2 FE foundation** [par after T1.1] · owns `FE/src/styles/**`, `FE/src/components/ui/**`, `FE/src/lib/api.js`, `FE/src/lib/mocks.js`, `FE/src/App.jsx`, `FE/src/main.jsx`, `FE/index.html`, `FE/public/favicon.svg`, `FE/vite.config.js`, `FE/package.json`
  Skills: `impeccable`, `emil-design-eng`, `ui-ux-pro-max` (a11y rules).
  Do: tokens (2.4), Google Fonts in `index.html`, global reset, theme toggle (reuse `FE/src/context/ThemeContext.jsx`), Navbar + Footer restyled, all primitives (2.5), shutter wipe `PageTransition`, router with every route in 2.1 pointing to `React.lazy` stub pages (`FE/src/pages/<Name>/index.jsx` returning a titled placeholder), 404, JAL logo + favicon, `/media` dev proxy. Delete old page SCSS that no longer applies.
  Deps allowed: `react-markdown`.
  Done when: every route renders its stub inside the new chrome in both themes; build + lint pass.
- [x] **T1.3 BE skeleton + schema** [par with T1.2] · owns `BE/**`
  Skills: `superpowers:test-driven-development`, `security-review` at end of Phase 2.
  Do: `package.json` (type module), `src/index.js` (Express, json, `/api/health`), `db/schema.sql` (works table per brief + 2.3, `media/links/tags` as jsonb/text[], unique slug, index on `(published, date)`), `src/db.js` (`pg` Pool from `DATABASE_URL`), `Dockerfile` (node:22-slim), `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, `MINIO_*`, `CORS_ORIGIN=https://jose.web.id`), `npm run hash-password` script using Node `crypto.scrypt` (no bcrypt dep).
  Deps allowed: `express`, `pg`, `jsonwebtoken`, `express-rate-limit`, `cors`, `multer`, `sharp`, `minio`.
- [x] **T1.4 Infra** [par with T1.2/T1.3] · owns `docker-compose.yml`, `Caddyfile`, `deploy.sh`, root `.env.example`
  Do: compose for caddy/api/postgres/minio per section 1 (named volumes, postgres + minio not exposed publicly, api on internal network :4000). `Caddyfile` per section 1 plus `encode gzip zstd`, long cache for `/assets/*`. `deploy.sh`: `npm ci && npm run build` in `FE`, `rsync` repo (excluding node_modules) + `FE/dist` to `$EC2_HOST:~/jose.web.id`, `ssh` `docker compose up -d --build`. Local dev: `docker compose up postgres minio` + `npm run dev` in BE and FE.

### Phase 2: Build (all [par], each owns only its paths)

FE page tasks use primitives from T1.2. They may add files only under their own `FE/src/pages/<Name>/` folders and `FE/src/data/<name>.js`. Need a new shared primitive? Ask orchestrator; do not edit `components/ui`.

- [x] **T2.1 BE API** · owns `BE/src/**`, `BE/test/**`
  Public + admin routes per 2.2. JWT middleware, scrypt `timingSafeEqual` login check, rate limit on `/api/login`, CORS `CORS_ORIGIN` only, input validation (type enum, slug format, embed host allowlist youtube.com/youtube-nocookie.com/vimeo.com), upload: multer memory, sharp to webp 1600 + 600 thumb, put to MinIO, return `/media/...` urls. Tests with `node --test` + a test DB covering: drafts hidden publicly, auth required on writes, login rate limit, bad embed rejected.
- [x] **T2.2 Home + 3D hero** · owns `FE/src/pages/Home/**`
  Skills: `three`, `impeccable` (`animate`, `overdrive`), `emil-design-eng`.
  Deps allowed: `three`, `@react-three/fiber`, `@react-three/drei`.
  Floating contact sheet of work stills as planes in depth, cursor drift (spring), Signal dot focus point. Lazy loaded chunk; static fallback image grid on mobile (`<768px`), reduced motion, or no WebGL. Hero text: name, simplified titles, REC dot. Featured works (from API, 3 latest) + featured products. Placeholder stills (neutral frames) until user provides assets.
- [x] **T2.3 Works feed + detail** · owns `FE/src/pages/Works/**`, `FE/src/pages/WorkDetail/**`
  Type filter (URL query `?type=`), MediaCards with FrameCounter + MetaRow, detail with `react-markdown` body, gallery (lightbox optional, keyboard accessible) or responsive embed, links, tags. Loading, empty, error states.
- [x] **T2.4 Products + Projects** · owns `FE/src/pages/Products/**`, `FE/src/pages/ProductDetail/**`, `FE/src/pages/Projects/**`, `FE/src/data/products.js`, `FE/src/data/projects.js`
  Skill: `anthropic-skills:pdf` to read `JoseAndreasLie'sPortfolio.pdf`.
  Splitter (splitter.jose.web.id) + Badminton (badminton.jose.web.id): link, desktop+mobile screenshot slots, stack, write up. Echo: case study only, badge, mock screenshots, no URL. Projects from PDF.
- [x] **T2.5 About** · owns `FE/src/pages/About/**`, `FE/src/data/portfolio.js`
  Skill: `anthropic-skills:pdf` for `FE/public/CV_JoseAndreasLie.pdf`. Bio, skills, experience timeline, education, CV link. Reuse and correct `data/portfolio.js`; add education. Simplify titles per brief.
- [x] **T2.6 Contact + Admin** · owns `FE/src/pages/Contact/**`, `FE/src/pages/Admin/**`
  Contact: port EmailJS logic from old `Contact.jsx`, visible labels, inline errors, sending/sent/failed states. Admin: login (token in `sessionStorage`), works table (drafts included), create/edit form for every Work field, image upload with progress (calls `/api/upload`), embed URL field, publish toggle, delete with confirm. `<meta name="robots" content="noindex">`. Operate mode: plain, fast, no hero motion.

### Phase 3: Integrate + harden [seq]

- [x] **T3.1 Integration** · orchestrator: run full stack locally via compose, create 3 sample works through Admin (one per type incl. a video embed), confirm they show on `/works`, `/works/:slug`, Home.
- [x] **T3.2 Quality pass** · read only, then hand fixes back to owners
  Skills: `impeccable` (`audit`, `harden`, `polish`, then `impeccable detect --json FE/src`), `emil-design-eng` (motion review table), `ui-ux-pro-max` (pre delivery checklist), `security-review` on `BE/`, `code-review`.
  Checks: Lighthouse (perf, a11y at least 90), CLS < 0.1, both themes contrast 4.5:1, keyboard nav, reduced motion, mobile 375px no horizontal scroll, Three.js chunk not in main bundle, no gradients, no decorative dashes, Echo leak grep: `grep -ri "echo" FE/src` reviewed by hand.
- [ ] **T3.3 Deploy** · orchestrator: provision EC2 (Docker, ports 80/443), DNS A record jose.web.id to EC2, fill `.env`, `./deploy.sh`, smoke test `https://jose.web.id`, `/api/health`, admin login, upload.

## 4. Dependency graph

```
T1.1 ──> T1.2 ──┬─> T2.2 ┐
                ├─> T2.3 │
                ├─> T2.4 ├─> T3.1 ─> T3.2 ─> T3.3
                ├─> T2.5 │
                └─> T2.6 ┘
T1.3 ─────────────> T2.1 ┘
T1.4 ──────────────────────> T3.1
```

Max parallelism: Phase 1 = 3 agents (T1.2, T1.3, T1.4 after T1.1). Phase 2 = 6 agents.

## 5. Assets the user still owes (placeholders until then)

8 to 12 work stills (1600px+), Splitter + Badminton screenshots (desktop + mobile), Echo mock data screenshots, admin password, EmailJS keys, EC2 host + SSH key. Placeholders must be neutral frames with the Viewfinder motif, never stock photos.

## 6. Skills index

| Skill | Use in |
|---|---|
| `impeccable` | T1.1 init/document, T1.2, T2.2 animate/overdrive, T3.2 audit/harden/polish/detect |
| `emil-design-eng` | motion and interaction details (T1.2, T2.2, T3.2 review) |
| `ui-ux-pro-max` | a11y/touch/forms rules, T3.2 checklist |
| `three` | T2.2 R3F hero |
| `anthropic-skills:pdf` | T2.4, T2.5 content extraction |
| `superpowers:test-driven-development` | T2.1 |
| `security-review`, `code-review` | T3.2 |
| `find-skills` | if an agent hits a domain with no installed skill (e.g. `npx skills find express`), propose, don't install unasked |
