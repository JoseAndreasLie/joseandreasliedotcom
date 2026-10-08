# Portfolio Brief

Fill answers below each question. Use for React+Vite build.

## 1. About You

- Full name / display name: Jose Andreas Lie
- Title/tagline (e.g. "Frontend Developer"): Project Manager / Fullstack Developer
- Short bio (2-4 sentences): I am a Lifetime Learner with T Shaped Skill as a World Class Developer. I was an Alumni of Apple Developer Academy, and I have a working background in Backend Engineer
- Profile photo? (yes/no, path if have file): No
- Location (optional): Indonesia
- Contact email: jose.lie2208@gmail.com
- Social links (GitHub, LinkedIn, Twitter/X, etc): GitHub, Instagram, Linked In = @joseandreaslie
- Resume/CV link or file? ./CV_JoseAndreasLie.pdf

## 2. Sections Wanted

Check which sections you want (yes/no):

- Hero/intro: Yes
- About: Yes
- Skills/tech stack: Yes
- Projects: Yes
- Experience/work history: Yes
- Education: Yes
- Blog/writing: Yes, as "Works" feed (video edits, photoshoots, projects, writing). Content managed via own backend (see Section 5)
- Live Products: Yes (see Section 3)
- Testimonials: No
- Contact form: Yes
- Footer: Yes

## 3. Projects, Skills/Tech Stack

Analyze from this path: ./JoseAndreasLie'sPortfolio.pdf

### Live Products

- Splitter: splitter.jose.web.id
  - What: Expense splitter for groups
  - Show: Public link, screenshots (desktop + mobile), stack, short write up
- Badminton: badminton.jose.web.id
  - What: Badminton matchmaking
  - Show: Public link, screenshots (desktop + mobile), stack, short write up
- Echo: Money Ledger for money related business operations
  - Status: CONFIDENTIAL. In production, used by a client with real data
  - Show: Case study only (problem, architecture, stack, my role)
  - Badge: "Private · in production"
  - Screenshots: mock data only
  - Do NOT show: URL, client name, any real data

### Works (feed)

- Types: Video (editing), Photo (photoshoots), Project, Writing
- Each post: title, type, date, cover image, summary, body (markdown), gallery or video embed, tags, gear/"shot on" (optional), links
- Video: embed from YouTube/Vimeo (not uploaded to own server)
- Photo: uploaded via admin page, auto resized to webp

# 4. Design Preferences

- Color scheme (dark/light/both toggle/specific colors): Dark & Light
- Style vibe (minimal, playful, corporate, brutalist, glassmorphism, etc): Minimal, full rebrand (Brand v2 below)
- Font preference (or "no preference"): See Brand v2
- Layout (single-page scroll vs multi-page with routing): Multi Page with Routing
- Animations? (none / subtle / heavy — e.g. framer-motion): Heavy Animation, respect reduced motion
- Three.js: Yes, Home hero only (lazy loaded, static fallback on mobile/reduced motion)
- Reference sites you like (URLs): None

### Brand v2: "Signal & Frame" (confirmed)

Idea: an engineer who also shoots. Systems precision + camera eye. Every work is a "frame", meta reads like camera EXIF / log lines.

- Palette (flat, no gradients):
  - Ink #0B0B0C (dark bg)
  - Graphite #1A1A1C (dark surface)
  - Paper #EEECE7 (light bg)
  - Ash #8C8A85 (dim text in dark theme, hairline rules)
  - Smoke #66645F (dim text in light theme, 5.0:1 on Paper)
  - Signal #E5482D (REC light red, accent, max \~10% of screen)
  - Light theme swaps Ink and Paper. Copper accent retired
- Type (Google Fonts):
  - Display: Newsreader (italic for accents)
  - Body: Schibsted Grotesk
  - Meta / labels: JetBrains Mono, uppercase, tracked, small
- Logo mark: "JAL" monogram inside viewfinder corner brackets + small Signal dot (REC). SVG, also favicon
- Motifs: viewfinder corners on media cards, frame counters (FR 012 / 040), meta rows (2026 · VIDEO · SONY FX3), hairline 1px rules
- Motion: shutter wipe page transitions, REC dot pulse, cursor drift on hero
- Three.js hero: floating "contact sheet" of work stills as planes in depth, drifts with cursor, Signal dot as focus point

## 5. Technical Preferences

- Styling approach (plain CSS / CSS Modules / Tailwind / styled-components): SCSS
- Routing needed? (yes/no — React Router): Yes
- Contact form backend (none / mailto link / EmailJS / Formspree / custom API): EmailJS
- Deployment target (Vercel / Netlify / GitHub Pages / other): Frontend and API both on AWS EC2. Frontend at jose.web.id, API at jose.web.id/api (Express on port 4000)
- Repo layout: /FE (React + Vite app), /BE (Node + Express API)
- Need TypeScript? (yes/no): No
- 3D: Three.js via @react-three/fiber + @react-three/drei

### Backend (Works upload)

- Stack: Node.js + Express + PostgreSQL, in /BE folder of this repo, listens on port 4000
- Hosting: AWS EC2, Docker Compose (api + postgres + minio), Caddy for HTTPS. Caddy serves the /FE build at jose.web.id and reverse proxies jose.web.id/api/* to api:4000
- Storage: images to MinIO, resized with sharp to webp (1600px + 600px thumb)
- Video: YouTube/Vimeo embed URL only
- Table works: id, slug, type (video/photo/project/writing), title, summary, body, cover_url, media, links, tags, shot_on, date, published, created_at
- Public API: GET /api/works?type=, GET /api/works/:slug (published only)
- Admin API: POST/PUT/DELETE /api/works, POST /api/upload, POST /api/login
- Auth: single admin, hashed password in env, JWT bearer token, rate limited login, CORS only for `https://jose.web.id` (same origin, FE calls relative /api)
- Admin UI: hidden /admin page in the React app (login, post form, upload)
- Not now: multi user, comments, rich text editor

## 6. Content Assets

- Do you have images/logos ready, or need placeholders for now? Use Placeholders for now. To provide:
  - 8 to 12 work stills (from video edits + photoshoot picks), min 1600px wide, for hero + Works
  - Splitter + Badminton screenshots (desktop + mobile)
  - Echo screenshots with MOCK data only
  - No 3D model needed for Three.js
- Any existing content (old portfolio, LinkedIn text) to reuse? As the same, CV_JoseAndreasLie.pdf and JoseAndreasLie'sPortfolio.pdf

## 7. Anything Else

- Other must-haves or things to avoid: No Gradient Color Background, No random Dashes (-)
- Never show Echo real client data, client name, or URL anywhere (site, screenshots, repo)