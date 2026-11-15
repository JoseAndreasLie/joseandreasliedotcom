# FABLE-PLAN.md: improvement plan for jose.web.id

Reviewed 2026-11-15 at commit `2ef8d48` (`1.1.0`). No tracked file other than this one was changed.

**Stack (identified from the repo)**

- `FE/`: React 19, Vite 8, JavaScript (no TypeScript), SCSS, React Router 7 (client-side SPA), framer-motion, three + @react-three/fiber (Home hero only), react-markdown, EmailJS, oxlint.
- `BE/`: Node >= 22, Express 5, Sequelize 6 + PostgreSQL, MinIO + sharp for images, JWT single-admin auth, `node:test`.
- Hosting: one EC2 box, nginx serving `FE/dist`, proxying `/api` (pm2) and `/media` (MinIO). Deploy by `deploy.sh` (rsync + ssh). No CI.

**How this was checked**

- Read every source file in `FE/src`, `BE/src`, `BE/db/migrations/0005-seed-content.cjs`, configs, and the root docs.
- Ran `npm install`, `npm run build`, `npm run lint`, `npm audit`, `npm outdated` in `FE`; `npm audit` and `npm outdated` in `BE`.
- Ran the FE dev server against dev mocks and measured the DOM at 1280 px and 375 px wide.
- Made read-only GET requests to the public live site `https://jose.web.id` (headers, `/api/*`, `/robots.txt`, `/sitemap.xml`).
- Not done: BE tests (need a local Postgres `jose_test`), Lighthouse, real-device testing, screen-reader testing. Screenshots of animated states were unreliable in the hidden preview pane, so visual-polish judgments below are from code and DOM measurements, not pixels.

Labels: **[Fact]** = observed in code, build output, or a live response. **[Opinion]** = design or taste call.

## Implementation status (2026-11-15, uncommitted working tree)

File and line references below describe the repo at `2ef8d48`, before these changes.

| Status | Tasks |
|---|---|
| Done in code | T03, T05, T06, T09, T10, T11, T12, T13, T14, T15, T16, T17, T18, T20, T21, T22, T23 |
| Partly done | T04: unused `tagline` removed and "about 25 peers" fixed. Education status, role wording and the CV PDF still need Jose's answers. |
| Not done, needs the server | T01 deploy, T02 compression and HTTP/2, T19 CSP |
| Not done, needs content from Jose | T07 project entries, T08 product screenshots and Echo case study, alt text for the 33 live gallery images (T13 step 1 only adds the admin prompt) |
| Not done, Jose's call | T24 removing the PDF and MP4 from git |

Differences from the written steps:

- T03: no `<link rel="canonical">`. A static canonical pointing at `/` would be served on every route of the SPA and tell search engines that every page is the home page. The `email` field was left out of the Person JSON-LD.
- T16: the bio and skills were rewritten from facts already in the repo and the CV. Jose should read `FE/src/data/portfolio.js` and correct anything that overstates.
- T17: fonts come from `@fontsource/*` packages imported in `FE/src/main.jsx` instead of hand-downloaded files, so Vite hashes them into `/assets/` and they get the existing immutable cache rule. No preload tags.
- T20: `Works` and `WorkDetail` now use `useFetch`; only the `Works` error state moved to `LoadState`. The 404 and empty states keep their own markup.
- T21: the two-blade framer-motion shutter is now one CSS blade that opens over the new page (250 ms), skipped on the first page of a visit. No View Transitions API and no router change. `framer-motion` is uninstalled.
- T22: `links` and `media` are no longer in list responses for works and projects.

Checked after the changes: FE lint clean, FE tests 3/3, BE tests 102/102 against local `jose_test`, FE build succeeds, `npm audit` reports 0 in FE and 11 in BE (8 moderate, 3 high, all needing `--force`). Entry chunk went from 121.73 kB to 83.57 kB gzip. Dev server with mocks checked at 1280 px and 375 px: every route renders, focus and scroll reset on navigation, no external font requests, no horizontal scroll. Not checked: the real API with real data, the EmailJS send path, the CI workflow on GitHub, `deploy.sh` end to end.

---

## 1. Summary

The engineering is in good shape: the build is clean, lint passes with no output, the code is small and consistently structured, accessibility basics are well above average (skip link, focus management, reduced motion, native `<dialog>` lightbox, 44 px targets, no overflow at 375 px), and no secrets are tracked. The gaps are almost all about reaching and convincing a recruiter. The site is a client-rendered SPA whose static HTML carries only `<title>Jose Andreas Lie</title>`, so every shared link (LinkedIn, WhatsApp, Slack) previews with no description and no image, and there is no sitemap or structured data. The project entries, which are the proof, are thin: the seeded projects have no body, no links, no cover image, and one-line notes, so a detail page is close to empty. The live site is an older build than this repo (`/api/projects` and `/api/products` return 404 in production; Jose confirmed on 2026-11-15 that `1.1.0` is not deployed yet) and it serves JS and CSS uncompressed. Smaller issues: stale facts (graduation still "Expected" Aug 2026), the CV and GitHub are not reachable from the hero, and 21 known dependency advisories that `npm audit fix` mostly clears.

---

## 2. Build results

Problems only. Everything not listed here passed.

### FE `npm install`

```
5 high severity vulnerabilities
```

```
npm warn install-scripts 2 packages have install scripts not yet covered by allowScripts:
npm warn install-scripts   @parcel/watcher@2.6.0 (install: node-gyp rebuild)
npm warn install-scripts   fsevents@2.3.3 (install: (install scripts present))
```

`FE/package-lock.json` was not changed by the install (`git status` clean afterwards), so no revert was needed.

### FE `npm run build`

Succeeded (`✓ built in 406ms`, 674 modules). One warning:

```
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

Largest outputs:

```
dist/assets/Markdown-CerXZw1G.js        118.02 kB │ gzip:  35.83 kB
dist/assets/index-DtVZ2B9q.js           377.14 kB │ gzip: 121.73 kB
dist/assets/HeroScene-B-vdDYiT.js       920.46 kB │ gzip: 245.10 kB
```

`HeroScene` is the chunk over 500 kB. It is lazy and only requested at >= 768 px with motion allowed and WebGL2 (`FE/src/pages/Home/index.jsx:12-20,73`).

### FE `npm run lint`

Passed with no output.

### FE `npm audit`

```
nanoid  <3.3.18
Severity: high
react-router  7.12.0 - 7.18.1
Severity: high
React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response - https://github.com/advisories/GHSA-qwww-vcr4-c8h2
source-map-js  1.0.0 - 1.2.1
Severity: high
vite  8.0.0 - 8.1.5
Severity: high
5 high severity vulnerabilities

To address all issues, run:
  npm audit fix
```

[Fact] The react-router advisory is for RSC mode, which this app does not use (`BrowserRouter` in `FE/src/main.jsx:9`). The vite, nanoid and source-map-js advisories are in dev/build tooling. All have a non-breaking fix.

### BE `npm audit`

```
body-parser  2.0.0 - 2.3.0
Severity: high
body-parser vulnerable to Denial of Service via trailing bytes after a compressed request body - https://github.com/advisories/GHSA-27r3-jxmh-p828
fix available via `npm audit fix`

multer  2.0.0 - 2.4.0
Severity: high
multer vulnerable to Denial of Service via a pending asynchronous fileFilter after request teardown - https://github.com/advisories/GHSA-q7qp-rjg7-q26m
fix available via `npm audit fix`

16 vulnerabilities (1 low, 10 moderate, 5 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force
```

[Fact] `body-parser` is reachable without auth (`express.json` at `BE/src/app.js:17` runs before `/api/login`). `multer` runs only after `requireAuth` (`BE/src/upload.js:27`). The advisories that need `--force` (`decode-uri-component`/`query-string`/`stream-json` via `minio`, `glob`/`minimatch` via `sequelize-cli`, `uuid` via `sequelize`) would install `minio@7.1.3`, `sequelize-cli@6.6.2` or `sequelize@3.30.0`, all breaking downgrades.

### `npm outdated`

FE, in range (patch/minor): `@react-three/fiber`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `oxlint`, `react`, `react-dom`, `react-router-dom` (7.18.1 -> 7.18.5), `sass`, `vite` (8.1.5 -> 8.3.8). Majors available: `@emailjs/browser` 4.4.1 -> 5.0.3, `framer-motion` 12.42.2 -> 14.14.0.
BE, in range: `express` 5.2.1 -> 5.3.0, `express-rate-limit` 8.7.1 -> 8.7.4, `multer` 2.4.0 -> 2.5.0.

### Not run

- BE tests: need Postgres (`README.md:29`).
- Root `npm test` is a stub that always exits 1 (`package.json:7`).

### Live site observations (2026-11-15, read-only)

- [Fact] `GET /api/projects` and `GET /api/products` return `{"error":"not found"}` with 404. `GET /api/works` and `/api/health` return 200.
- [Fact] `index.html` has `Last-Modified: Thu, 08 Oct 2026` and references `/assets/index-lpe3QojC.js`; this repo builds `index-DtVZ2B9q.js`. The commits that add the projects and products API are dated 2026-10-28 to 2026-10-30.
- [Fact] With `Accept-Encoding: gzip, br`, `/assets/index-lpe3QojC.js` (377,640 bytes) and the CSS return no `Content-Encoding`. `/` (HTML) returns `Content-Encoding: gzip`.
- [Fact] Responses are `HTTP/1.1`.
- [Fact] `/sitemap.xml` and `/og.png` return 200 `text/html` (the SPA fallback).
- [Fact] Header `Content-Security-Policy-Report-Only: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'` is present. It is report-only with no report endpoint. If enforced as written it would block Google Fonts, YouTube embeds and EmailJS.
- [Fact] All 33 gallery images across the three published frames have `alt: ""`.

---

## 3. Prioritized task table

Ordered by impact relative to effort, quick wins first.

| ID | Task | Area | Why it matters | Files affected | Impact | Effort |
|---|---|---|---|---|---|---|
| T01 | Deploy `1.1.0` with a smoke test (confirmed not deployed yet) | DX / deploy | Live API has no `/projects` or `/products`; recruiters see the 2026-10-08 site until this ships | server, `deploy.sh` | H | S |
| T02 | Turn on compression (and HTTP/2) for `/assets` on nginx | Performance | Desktop Home downloads about 1.3 MB of JS raw instead of about 370 kB | server nginx config, `README.md` | H | S |
| T03 | Add static share and SEO tags to `index.html` (description, canonical, Open Graph, Twitter, Person JSON-LD, OG image) | SEO & sharing | Shared links currently preview as a bare title with no image | `FE/index.html`, `FE/public/og.png` (new) | H | S |
| T04 | Fix stale and inconsistent facts (education status, CV, title wording) | Content | Wrong dates read as neglect; site and CV describe different roles | `FE/src/data/portfolio.js`, `FE/public/CV_JoseAndreasLie.pdf` | H | S |
| T05 | Put CV, GitHub and LinkedIn in the hero and on Contact | Content / UX | CV is one page away and GitHub is only in the footer | `FE/src/pages/Home/index.jsx`, `FE/src/pages/Contact/index.jsx` | H | S |
| T06 | Run `npm audit fix` (no `--force`) in `FE` and `BE` | Security / DX | Clears the unauthenticated `body-parser` DoS and all FE advisories | both `package-lock.json` | M | S |
| T07 | Rewrite project entries as problem, role, outcome, stack, links, cover | Content | Project detail pages are nearly empty; this is the main proof for recruiters | content via `/admin`; optional `FE/src/pages/Projects/index.jsx` | H | M |
| T08 | Add product screenshots and finish the Echo case study | Content | All three products show a letter placeholder; Echo "case study" is one paragraph | content via `/admin` | H | M |
| T09 | Add `sitemap.xml` and a `Sitemap:` line in `robots.txt` | SEO | `/sitemap.xml` currently returns the SPA HTML | `FE/public/sitemap.xml` (new), `FE/public/robots.txt` | M | S |
| T10 | Reorder nav and Home sections for recruiters | UX | Photography is first in the nav of an engineer's site | `FE/src/components/Navbar.jsx`, `FE/src/pages/Home/index.jsx` | M | S |
| T11 | Add spam protection to the contact form | Security | Public EmailJS key with no honeypot or allowlist check | `FE/src/pages/Contact/index.jsx`, EmailJS dashboard | M | S |
| T12 | Serve thumbnails in cards instead of 1600 px covers | Performance | Cards about 380 px wide load full-size images | `FE/src/components/ui/MediaCard.jsx`, `FE/src/pages/Projects/index.jsx` | M | S |
| T13 | Accessibility fixes: gallery alt text, `FrameCounter` label, light-theme input border, duplicate `<title>` | Accessibility | Real gallery images have no text alternative | `FE/src/pages/Admin/EntryForm.jsx`, `FE/src/components/ui/FrameCounter.jsx`, `FE/src/pages/Contact/Contact.scss`, `FE/index.html` | M | S |
| T14 | End detail pages with next steps (next item, contact) | UX | Detail pages stop dead; the only way on is the top back link | `FE/src/pages/WorkDetail/index.jsx`, `FE/src/pages/ProductDetail/index.jsx`, `FE/src/pages/NotFound/index.jsx` | M | S |
| T15 | Replace camera jargon in functional copy | General visitors | "Rec", "No signal", "FR 000", "frames" are unclear on errors and empty states | `FE/src/pages/Home/index.jsx`, `FE/src/components/ui/LoadState.jsx`, `FE/src/pages/Works/index.jsx`, `FE/src/pages/WorkDetail/index.jsx` | M | S |
| T16 | Rework Skills and bio copy | Content | Skills list omits what this site itself uses; bio leans on cliches | `FE/src/data/portfolio.js` | M | S |
| T17 | Self-host the three font families | Performance / privacy | Render-blocking third-party stylesheet; blocks a strict CSP | `FE/index.html`, `FE/src/styles/global.scss`, `FE/public/fonts/` (new) | M | M |
| T18 | Add CI and root scripts (lint, build, tests) and guard `deploy.sh` | DX | Nothing runs lint or tests before a deploy | `.github/workflows/ci.yml` (new), `package.json`, `FE/package.json`, `deploy.sh`, `.nvmrc` (new) | M | M |
| T19 | Enforce a real CSP | Security | Current header is report-only and would break the site if enforced | server nginx config, `README.md` | M | M |
| T20 | Remove duplication and dead code | Code quality | Two pages re-implement `useFetch`; three copies of the load/error UI | see details | L | M |
| T21 | Take framer-motion out of the entry bundle | Performance | 121.73 kB gzip entry chunk; framer-motion is used for one transition | `FE/src/components/ui/PageTransition.jsx`, `FE/src/App.jsx`, `FE/package.json` | M | M |
| T22 | Trim the works list payload | Performance | List responses carry every gallery item to render three cards | `BE/src/app.js`, `BE/test/works.test.js` | L | S |
| T23 | Fix stale docs and env examples | DX | README points to a file that no longer exists; root `.env.example` is from the Docker era | `README.md`, `.env.example`, `PLAN.md`, `PRODUCT.md` | L | S |
| T24 | Move large binaries out of git | DX | 10.9 MB of PDF and MP4 at the root; the PDF filename breaks shell tools | `JoseAndreasLie'sPortfolio.pdf`, `ASSETS/` | L | S |

---

## 4. Task details

### T01. Deploy `1.1.0`

Findings

- [Fact] Jose confirmed on 2026-11-15 that `1.1.0` has not been deployed. The live 404s below are expected, not a regression.
- [Opinion] Do T03, T04, T05 and T06 first so the first `1.1.0` deploy already carries share tags, correct facts and patched dependencies. T07 and T08 are content edits in `/admin` and can only start after this deploy, because the projects and products tables do not exist in production yet.

- [Fact] Live `/api/projects` and `/api/products` return 404; live `index.html` is dated 2026-10-08 (see section 2).
- [Fact] Home at HEAD fetches all three lists from the API (`FE/src/pages/Home/index.jsx:152-154`). If the API lacks a route, the section renders "This section is offline right now." (`index.jsx:123-127`).
- [Fact] `deploy.sh` has no post-deploy check (`deploy.sh:19` ends at `pm2 restart`).

Steps

1. On the server (deploys are rsync, so there is no git log to read): check whether `/var/www/jose.web.id/server/src/crud.js` exists, and list applied migrations with `psql "$DATABASE_URL" -c 'select name from "SequelizeMeta" order by 1'` to see whether 0002 to 0005 have run.
2. From a clean `main`: `npm run deploy`.
3. Smoke test, in order: `curl -s https://jose.web.id/api/health`, `curl -s https://jose.web.id/api/projects | head -c 200`, `curl -s https://jose.web.id/api/products | head -c 200`, then load `/`, `/projects`, `/products/echo` in a browser.
4. Append those three `curl -fsS` checks to the end of `deploy.sh` so a broken deploy exits non-zero.
5. Tick or delete `T3.3 Deploy` in `PLAN.md:142`.

### T02. Compress `/assets` and enable HTTP/2

Findings

- [Fact] Live JS and CSS are served without `Content-Encoding`; HTML is gzipped. Live is HTTP/1.1.
- [Fact] The README config has `gzip on; gzip_types text/css application/javascript application/json image/svg+xml;` (`README.md:95-96`) and `listen 80;` (`README.md:86`). The live header set differs from the README (CSP report-only, `includeSubDomains`), so the live config is not the README config. The cause of the missing compression was not determined.

Steps

1. On the server run `sudo nginx -T | grep -n -i -E "gzip|http2|listen"` and compare with the README.
2. In the `server` block that listens on 443 make sure these are present: `gzip on; gzip_comp_level 6; gzip_min_length 1024; gzip_vary on; gzip_types text/css application/javascript text/javascript application/json image/svg+xml;` and `http2 on;` (nginx 1.25+; live reports 1.28.3).
3. `sudo nginx -t && sudo systemctl reload nginx`.
4. Verify: `curl -s -H 'Accept-Encoding: gzip' -o /dev/null -D - https://jose.web.id/assets/<current index js> | grep -i content-encoding` prints `gzip`, and `curl -sI --http2 https://jose.web.id/ | head -1` prints `HTTP/2 200`.
5. Copy the final config back into `README.md` so the two stop drifting.

### T03. Static share and SEO tags in `index.html`

Findings

- [Fact] `FE/index.html` contains only a title, theme-color, favicon and fonts (`index.html:4-22`). There is no description, canonical, Open Graph, Twitter card or JSON-LD.
- [Fact] Per-page `<title>` and `<meta name="description">` are rendered by React 19 at runtime (for example `FE/src/pages/About/index.jsx:35-39`). Link-preview bots do not run JavaScript, so they see only the static HTML.
- [Fact] Only an SVG favicon is provided (`index.html:8`); there is no PNG fallback or `apple-touch-icon`.
- [Fact] `theme-color` is fixed to `#0B0B0C` (`index.html:7`) in both themes.

Steps

1. Create `FE/public/og.png` at 1200 x 630: Ink background `#0B0B0C`, the JAL viewfinder mark, "Jose Andreas Lie" in Newsreader, "Project Manager · Fullstack Developer" in mono. Keep it under 300 kB.
2. Create `FE/public/apple-touch-icon.png` (180 x 180) from `FE/public/favicon.svg`.
3. In `FE/index.html` `<head>`, after line 8, add:

```html
<meta name="description" content="Jose Andreas Lie: project manager and fullstack developer in Tangerang, Indonesia. Backend systems in Node.js and PostgreSQL, live products, and photo and video work." />
<link rel="canonical" href="https://jose.web.id/" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Jose Andreas Lie" />
<meta property="og:title" content="Jose Andreas Lie · Project Manager · Fullstack Developer" />
<meta property="og:description" content="Backend systems in Node.js and PostgreSQL, live products, and photo and video work." />
<meta property="og:url" content="https://jose.web.id/" />
<meta property="og:image" content="https://jose.web.id/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jose Andreas Lie",
  "url": "https://jose.web.id/",
  "image": "https://jose.web.id/og.png",
  "jobTitle": "Project Manager and Fullstack Developer",
  "email": "mailto:jose.lie2208@gmail.com",
  "address": { "@type": "PostalAddress", "addressLocality": "Tangerang", "addressCountry": "ID" },
  "alumniOf": { "@type": "CollegeOrUniversity", "name": "Universitas Multimedia Nusantara" },
  "knowsAbout": ["Node.js", "Express.js", "PostgreSQL", "React", "Swift", "Project management"],
  "sameAs": [
    "https://github.com/joseandreaslie",
    "https://www.linkedin.com/in/jose-andreas-lie/",
    "https://instagram.com/joseandreaslie"
  ]
}
</script>
```

4. Remove the per-page `<meta name="description">` on Home only (`FE/src/pages/Home/index.jsx:161-164`) so Home does not end up with two descriptions; other pages keep theirs (React inserts them, and the static one remains as the no-JS fallback). Alternatively leave all of them and accept duplicates; see T13 for the same issue with `<title>`.
5. After T01/T02, validate with the LinkedIn Post Inspector and the Rich Results Test.

Known limit: every URL will share the Home preview. Per-page previews need prerendering; see section 5.

### T04. Fix stale and inconsistent facts

Findings

- [Fact] Education shows `period: 'Aug 2022 to Aug 2026'`, `status: 'Expected'` (`FE/src/data/portfolio.js:90-91`). Today is 2026-11-15. The CV PDF says the same ("Aug 2022 - Aug 2026 (Expected)").
- [Fact] The site title is "Project Manager · Fullstack Developer" (`portfolio.js:4`). The CV summary opens "Backend Engineer and Project Manager". Contact says "Open to project management and fullstack roles" (`FE/src/pages/Contact/index.jsx:84`).
- [Fact] The CV PDF has no portfolio URL and no GitHub link. It lists ComePet only; AntarBul, BuahHati, Splitter, Badminton and Echo are absent.
- [Fact] `portfolio.js:55` and the CV both say "Collaborated with more or less 25 peers".
- [Fact] `profile.tagline` (`portfolio.js:5`) is not used anywhere in `FE/src`.

Steps

1. Update `education[0].status` and `period` in `portfolio.js:90-91` to the real state (graduated, or new expected date). `About` renders it at `FE/src/pages/About/index.jsx:81`.
2. Pick one role line and use it in the site title (`portfolio.js:4`), the CV summary, and LinkedIn.
3. Regenerate the CV: add `jose.web.id` and `github.com/joseandreaslie` to the header, fix the education line, add the live products. Replace `FE/public/CV_JoseAndreasLie.pdf` (keep the filename; `portfolio.js:12` and old links depend on it).
4. Change "more or less 25 peers" to "about 25 peers" in `portfolio.js:55` and the CV.
5. Delete the unused `tagline` line (`portfolio.js:5`).

### T05. CV, GitHub and LinkedIn in the hero and on Contact

Findings

- [Fact] Hero has three buttons: "See the projects", "Behind the Lens", "Get in touch" (`FE/src/pages/Home/index.jsx:96-102`). No CV link.
- [Fact] The CV link exists in two places: the About header (`FE/src/pages/About/index.jsx:51-53`) and a footer text link "CV" (`FE/src/components/Footer.jsx:10`). At 375 x 812 the About CV button sits at y = 861, below the first screen.
- [Fact] GitHub is linked only from the footer (`Footer.jsx:6`). Contact's "Direct" list has Email, WhatsApp, LinkedIn (`FE/src/pages/Contact/index.jsx:93-110`).
- [Fact] The Contact LinkedIn label is `@joseandreaslie` (`Contact/index.jsx:107`) while the profile URL slug is `jose-andreas-lie` (`portfolio.js:15`).
- [Opinion] A recruiter's three questions (who, what, how to reach) are answered in the hero for "who" and "what" but not for "CV" or "code".

Steps

1. In `Home/index.jsx:96-102` replace the "Behind the Lens" button with `<Button href={profile.resume} download>Download CV</Button>`. The lens stays reachable from the nav and its Home section.
2. Under the buttons add one `MetaRow`-style line of text links: GitHub, LinkedIn, Email, using `profile.social` and `profile.email`. Reuse the footer link styling (`FE/src/components/Footer.scss:26-41`).
3. In `Contact/index.jsx:93-110` add a GitHub row and a "CV" row (`href={profile.resume}`), and change the LinkedIn label to `in/jose-andreas-lie`.
4. Replace the hero line `Rec · Indonesia · An engineer who also shoots` (`Home/index.jsx:93-95`) with one plain sentence that carries skills, for example: "Backend-leaning fullstack developer and project manager in Tangerang. Node.js, PostgreSQL, React, Swift." Keep the `RecDot` if wanted.

### T06. `npm audit fix` without `--force`

Steps

1. `cd FE && npm audit fix && npm run build && npm run lint`.
2. `cd BE && npm audit fix && npm test` (needs Postgres, `README.md:29`).
3. Do not run `--force` in `BE`; see section 2 for what it would downgrade.
4. Commit both lockfiles. Expected remainder in `BE`: the `minio`, `sequelize-cli` and `sequelize` transitive advisories.

### T07. Project entries: problem, role, outcome, stack, links, cover

Findings

- [Fact] The four seeded projects have no `body`, no `links`, no `cover_url`, no `media` (`BE/db/migrations/0005-seed-content.cjs:4-58`). Each has one or two free-form notes ("Key insight", "Status", "Outcome", "Lesson").
- [Fact] With that data a project detail page renders: back link, meta row, title, one-sentence summary, an empty left column (`FE/src/pages/WorkDetail/index.jsx:179-185` renders an empty `<div />` when `body` is empty), and a sidebar with one note and tags. Confirmed in the dev server on `/projects/antarbul`.
- [Fact] BuahHati's outcome is "Published on the App Store." with no link (`0005-seed-content.cjs:38`).
- [Fact] Nine to Six has `year: null` and company "Aftersix" (`0005-seed-content.cjs:21-28`), a name that does not appear in the experience list (`FE/src/data/portfolio.js:28-69`).
- [Fact] Cards with no cover render the title's first letter (`FE/src/components/ui/MediaCard.jsx:18-20`), so Home's "Featured projects" shows "A", "N", "B".
- [Fact] The data model already supports everything needed: `body` markdown, `links`, `cover_url`, `media`, `notes` (`BE/src/models.js:33-49`). No schema change is required.
- [Opinion] The summary lines describe the product ("A fast, effective pet taxi platform"), not what Jose did or what changed because of it.

Steps (content, through `/admin`, for each of AntarBul, Nine to Six, BuahHati, ComePet)

1. Notes: use the same four labels in the same order on every project: `Problem`, `My role`, `Outcome`, `What I learned`. Two sentences each at most. `Outcome` needs a number or a concrete result (users, shipped, App Store, team size, time saved).
2. Links: add every public one (GitHub repo, App Store page, demo video, Figma). For private work add nothing and say "Private codebase" in `My role`.
3. Cover: one screenshot or app mockup, uploaded through the admin image field.
4. Body: three to six short paragraphs or a list covering architecture decisions and trade-offs. Add two or three screenshots as media.
5. Set `year` on Nine to Six and make its company line match the experience entry it belongs to.

Optional code step: in `FE/src/pages/WorkDetail/index.jsx:179-185`, when `body` is empty, render the notes in the main column instead of an empty `<div />`, so a short entry does not look broken.

### T08. Product screenshots and the Echo case study

Findings

- [Fact] All three products are seeded with no screenshots (the seed sets neither field, `0005-seed-content.cjs:60-109`; mocks show `screenshot_desktop: null`).
- [Fact] Echo's case study has `architecture: null` (`0005-seed-content.cjs:106`), so the page renders one "Problem" section (`FE/src/pages/ProductDetail/index.jsx:55-60`). The "Problem" text describes the product, not a problem.
- [Fact] `ASSETS/badminton.jose.web.id/Thumbnail.jpg` and `VideoPromotion.mp4` are tracked but not referenced by any code.
- [Fact] Product detail hard-codes the label "Web app" for non-case-study products (`ProductDetail/index.jsx:78`).

Steps

1. Capture desktop (16:10) and mobile (9:19.5) screenshots of Splitter and Badminton; upload via `/admin`.
2. Echo: produce mock-data screenshots as the brief requires (`PORTFOLIO_BRIEF.md:44-49`), then write `architecture` (components, data flow, why a ledger model, how correctness is protected) and rewrite `problem` as the before state. Never include the client, URL or real figures.
3. Add one outcome line per product to `summary` or `writeup` (who uses it, how often).
4. See Questions for what to do with the Badminton promo video.

### T09. Sitemap and robots

Findings

- [Fact] `FE/public/robots.txt` is two lines with no `Sitemap:` (`robots.txt:1-2`). `/sitemap.xml` on live returns the SPA HTML with status 200.

Steps

1. Create `FE/public/sitemap.xml` listing `https://jose.web.id/`, `/about`, `/projects`, `/products`, `/lens`, `/contact`, plus the current detail URLs (`/projects/antarbul`, `/projects/nine-to-six`, `/projects/buahhati`, `/projects/comepet`, `/products/splitter`, `/products/badminton`, `/products/echo`, and the three `/lens/<slug>` pages).
2. Append `Sitemap: https://jose.web.id/sitemap.xml` to `robots.txt`.
3. Submit in Google Search Console.
4. A static file goes stale when content is added through `/admin`. If that becomes a problem, generate it from the API in `deploy.sh`; not needed now.

### T10. Nav and Home order

Findings

- [Fact] Nav order is Behind the Lens, Products, Projects, About, Contact (`FE/src/components/Navbar.jsx:8-14`).
- [Fact] Home order is Featured projects, Behind the Lens, Live products (`FE/src/pages/Home/index.jsx:166-224`).
- [Fact] The hero imagery is built only from Behind the Lens covers (`FE/src/pages/Home/stills.js:8-11`).
- [Opinion] For a recruiter hiring a PM or developer, photography in the first nav slot and in the hero art frames Jose as a photographer first. "Products" versus "Projects" is also a distinction a visitor has to learn.

Steps

1. Reorder `links` in `Navbar.jsx:8-14` to: Projects, Products, About, Behind the Lens, Contact.
2. In `Home/index.jsx` move the "Live products" `CardSection` (lines 204-224) above "Behind the Lens" (lines 185-203).
3. Optional: add a one-line explainer under each Home section title ("Team and client work" / "Tools I built and run").

### T11. Contact form spam protection

Findings

- [Fact] The form sends straight from the browser with a public EmailJS key (`FE/src/pages/Contact/index.jsx:61`). There is no honeypot, captcha or rate limit in the code.
- [Fact] The three `VITE_EMAILJS_*` values are compiled into the public bundle by design (`Contact/index.jsx:7-9`). They are not secrets, but anyone can reuse them to send through the account.

Steps

1. EmailJS dashboard: open the account security settings and turn on whatever origin or domain restriction and rate limiting the plan offers, limited to `https://jose.web.id`. I did not verify which of these the current plan includes.
2. Add a honeypot: a visually hidden `<input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true">` in the form; in `onSubmit` (`Contact/index.jsx:46-69`), if it has a value, set status to `sent` and return without calling `emailjs.send`.
3. Add `maxLength` to the inputs (name 100, email 200, message 5000) in `FIELDS` (`Contact/index.jsx:24-28`).

### T12. Thumbnails in cards

Findings

- [Fact] `MediaCard` renders `cover` at full size (`FE/src/components/ui/MediaCard.jsx:16`); the upload pipeline produces a 1600 px file and a 600 px `_thumb` file (`BE/src/upload.js:31-44`).
- [Fact] The admin stores the full URL as the cover (`FE/src/pages/Admin/EntryForm.jsx:264-268`). On live the first cover is 77,294 bytes and its thumb 22,252 bytes.
- [Fact] Images have no `width`/`height`, but every frame has a CSS `aspect-ratio` (`FE/src/components/ui/ui.scss:210-213`), so layout does not shift.

Steps

1. Add a helper in `FE/src/pages/WorkDetail/media.js`: `export const thumbOf = (url) => /^\/media\/[\w-]+\.webp$/.test(url ?? '') ? url.replace(/\.webp$/, '_thumb.webp') : url`.
2. In `MediaCard.jsx:16` use `src={thumbOf(cover)}` with `srcSet={`${thumbOf(cover)} 600w, ${cover} 1600w`}` and `sizes="(min-width: 768px) 33vw, 100vw"`.
3. Do the same for the project list cover (`FE/src/pages/Projects/index.jsx:35`).
4. Leave the hero stills and the detail cover at full size.
5. Add one assertion for `thumbOf` to `FE/src/pages/WorkDetail/media.test.js`.

### T13. Accessibility fixes

Findings

- [Fact] Uploaded images are saved with `alt: ''` (`EntryForm.jsx:267`) and all 33 live gallery images have empty alt. The thumbnail button is labelled only "Open image 3 of 17" (`FE/src/pages/WorkDetail/index.jsx:160-162`) and the lightbox image gets `alt=""` (`FE/src/pages/WorkDetail/Lightbox.jsx:51`).
- [Fact] `FrameCounter` puts `aria-label` on a plain `<span>` with no role (`FE/src/components/ui/FrameCounter.jsx:7`). ARIA does not allow naming a generic element, so support is inconsistent.
- [Fact] In the light theme `--rule` is Ash (`FE/src/styles/_tokens.scss:82`), which the same file records as 2.9:1 on Paper (`_tokens.scss:80`). Contact inputs use it as their only boundary (`FE/src/pages/Contact/Contact.scss:100`); WCAG 1.4.11 asks for 3:1.
- [Fact] At runtime `<head>` holds two `<title>` elements, the React one and the static one from `index.html:6` (measured: `["About · Jose Andreas Lie", "Jose Andreas Lie"]`). `document.title` is correct because React's comes first.
- [Fact] Already good, keep: skip link (`FE/src/App.jsx:74`), focus moved to `<main>` on route change (`App.jsx:58-61`), `aria-current` nav, Escape closes the mobile menu (`FE/src/components/Navbar.jsx:26-36`), native modal dialog, global reduced-motion rule (`FE/src/styles/global.scss:202-211`), one `h1` per page with ordered headings, no horizontal scroll at 375 px, no link or button under 40 px tall on Home at 375 px.

Steps

1. In `EntryForm.jsx`, mark an image row with an empty alt as a warning ("Describe this photo") next to its alt input. Then write alt text for the 33 existing images in `/admin`.
2. `FrameCounter.jsx:7`: replace the `aria-label` with `<span aria-hidden="true">{text}</span><span className="visually-hidden">{label}</span>` inside the wrapper span.
3. `Contact.scss:100`: use `border: 1px solid var(--text-dim)` (Smoke, 5.0:1 on Paper per `_tokens.scss:80`) and keep `--accent` for focus and error.
4. Leave the duplicate `<title>` alone unless prerendering is adopted; removing the static one would leave non-JS clients with no title.

### T14. End detail pages with next steps

Findings

- [Fact] `WorkDetail` has one navigation element, the back link at the top (`FE/src/pages/WorkDetail/index.jsx:118`). `ProductDetail` has "All products" in the header only (`FE/src/pages/ProductDetail/index.jsx:87-89`). `NotFound` offers only "Back to home" (`FE/src/pages/NotFound/index.jsx:15`).

Steps

1. Add a footer block to `WorkDetail` and `ProductDetail`, after the body: `<Rule />`, then two buttons: `<Button to={kind.back}>{kind.browse}</Button>` and `<Button variant="primary" to="/contact">Get in touch</Button>`.
2. On `NotFound` add `<Button to="/projects">See the projects</Button>` beside "Back to home".
3. Skip previous/next links for now; they need the list fetched on every detail page.

### T15. Camera jargon in functional copy

Findings

- [Fact] Hero line: "Rec · Indonesia · An engineer who also shoots" (`FE/src/pages/Home/index.jsx:93-95`).
- [Fact] Error state label "No signal" and empty state label "FR 000" (`FE/src/components/ui/LoadState.jsx:19`, `FE/src/pages/Works/index.jsx:88,101`, `FE/src/pages/WorkDetail/index.jsx:87`).
- [Fact] Projects and products are numbered "FR 001 / 004" (`FE/src/components/ui/FrameCounter.jsx:5`), and lens items are called "frames" in counts and buttons (`Works/index.jsx:34,105`, `Home/index.jsx:190-191`).
- [Fact] The Home error text says "Try the full page in a moment" and links to a page that calls the same API (`Home/index.jsx:123-127`).
- [Opinion] The motif works as decoration. It costs clarity where the text has a job: errors, empty states, counts. "Shoots" is also ambiguous out of context.

Steps

1. Keep the viewfinder frames and counters as decoration. Change the words that carry meaning: "No signal" -> "Could not load", "FR 000" -> "Nothing here yet", "frames" -> "photos and videos" (or "posts") in `Works/index.jsx:34,103-105` and `Home/index.jsx:190-191`.
2. Replace the hero line as in T05 step 4.
3. Change the Home error text to "Could not load this section." with a "Try again" button wired to `state.retry` (already returned by `useFetch`, `FE/src/lib/useFetch.js:24`).

### T16. Skills and bio copy

Findings

- [Fact] Skills: Frontend has one item, "ReactJS"; TypeScript sits under Backend; Sequelize, SCSS, Vite, Three.js, nginx, MinIO, Jira and Agile practice are absent although the site and the experience bullets show them (`FE/src/data/portfolio.js:20-26`, `34-37`).
- [Fact] DevOps lists "GitHub Actions" (`portfolio.js:24`); this repo has no workflow.
- [Fact] The bio uses "lifetime learner" and "T shaped skill set" (`portfolio.js:6`).
- [Opinion] Both phrases are common filler on junior CVs. The second paragraph (`portfolio.js:8`) is more specific and stronger.

Steps

1. Rewrite `bio` to lead with the specific claim: years of experience, what was shipped (HRIS payroll modules, three live products), then the Academy.
2. Add a "Product and delivery" skills group (Agile, sprint planning, Jira, stakeholder updates) since PM is the first title.
3. Move TypeScript to wherever it is actually used, fill out Frontend, and only keep "GitHub Actions" if T18 lands or it is used elsewhere.

### T17. Self-host fonts

Findings

- [Fact] Fonts load from a render-blocking Google Fonts stylesheet with three families (`FE/index.html:17-22`).
- [Fact] The 3D hero draws canvas text in JetBrains Mono and redraws when fonts finish loading (`FE/src/pages/Home/HeroScene.jsx:76,99`).

Steps

1. Download woff2 (latin subset) for Newsreader 400 and 400 italic, Schibsted Grotesk 400/500/600, JetBrains Mono 400/500 into `FE/public/fonts/`.
2. Add `@font-face` rules with `font-display: swap` at the top of `FE/src/styles/global.scss`.
3. Delete `index.html:17-22`; add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the two fonts used above the fold (Newsreader 400, Schibsted Grotesk 400).
4. Confirm `/fonts/` gets the same immutable cache header as `/assets/` in nginx (`README.md:101-103` covers only `/assets/`).

### T18. CI, root scripts, deploy guard

Findings

- [Fact] There is no `.github/` directory. Root `package.json` has `deploy` and a failing `test` stub (`package.json:5-8`).
- [Fact] `FE/src/pages/WorkDetail/media.test.js` exists but `FE/package.json:6-11` has no `test` script.
- [Fact] `deploy.sh` builds and ships without running lint or tests and without checking the working tree (`deploy.sh:8-19`).
- [Fact] `BE/package.json:5-7` requires Node >= 22; FE declares nothing; there is no `.nvmrc`. No formatter config (no Prettier or `.editorconfig`).
- [Fact] The dev mock fallback triggers only on network failure (`FE/src/lib/api.js:65`). During this review another local app was listening on port 4000 and answered 404, so the dev site showed error states instead of mocks. `API_URL` overrides the proxy target (`FE/vite.config.js:10`).

Steps

1. `FE/package.json`: add `"test": "node --test \"src/**/*.test.js\""`.
2. Root `package.json`: replace the stub with `"lint": "npm --prefix FE run lint"`, `"build": "npm --prefix FE run build"`, `"test": "npm --prefix FE test && npm --prefix BE test"`.
3. Add `.nvmrc` containing `22`.
4. Add `.github/workflows/ci.yml` on push and pull request: Node 22, a `postgres:16` service with database `jose_test`, then `npm ci` in both packages, FE lint, FE build, FE test, BE test with `TEST_DATABASE_URL`.
5. `deploy.sh`: before line 8 add `git diff --quiet || { echo "uncommitted changes"; exit 1; }` and `npm --prefix FE run lint`.
6. README: document `API_URL=http://127.0.0.1:9 npm run dev` as the way to force mocks.

### T19. Enforce a CSP

Findings

- [Fact] Live sends a report-only CSP with no reporting endpoint (section 2), so it has no effect. The README defers CSP (`README.md:121`).
- [Fact] The page needs: an inline theme script (`FE/index.html:9-16`), Google Fonts (until T17), YouTube/Vimeo frames (`FE/src/pages/WorkDetail/media.js:4-14`), EmailJS (`FE/src/pages/Contact/index.jsx:61`), inline `style` attributes for `--i` (`FE/src/pages/Projects/index.jsx:29`), `data:` images in dev mocks only.
- [Fact] The admin JWT is in `sessionStorage` (`FE/src/lib/api.js:6-14`), so a CSP is the main defence if an XSS is ever introduced. Current XSS surface is small: markdown renders with `skipHtml` and link checks (`FE/src/pages/WorkDetail/Markdown.jsx:23`, `media.js:21-38`).

Steps (after T17)

1. Compute the hash of the inline script: `sha256` of the exact text between the `<script>` tags, base64.
2. Set in nginx: `Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-<hash>'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://api.emailjs.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`.
3. Ship as `-Report-Only` first, click through every page with the console open (Home 3D hero uses blob/canvas textures), then switch to enforcing.
4. Record the header in `README.md`. The hash must be recomputed whenever `index.html:9-16` changes.

### T20. Duplication and dead code

Findings

- [Fact] `Works` and `WorkDetail` each hand-roll the loading/error/retry state that `useFetch` already provides (`FE/src/pages/Works/index.jsx:17-30`, `FE/src/pages/WorkDetail/index.jsx:43-57` versus `FE/src/lib/useFetch.js:7-25`).
- [Fact] The "No signal / Try again" block exists three times: `FE/src/components/ui/LoadState.jsx:16-30`, `Works/index.jsx:85-96`, `WorkDetail/index.jsx:79-103`.
- [Fact] The site name is hard-coded in page titles in eight files instead of `profile.name` (for example `FE/src/pages/About/index.jsx:35`, `FE/src/pages/Contact/index.jsx:73`, `FE/src/pages/Projects/index.jsx:13`, `FE/src/pages/WorkDetail/index.jsx:12`).
- [Fact] Cross-folder imports: `ProductDetail` imports `Markdown` from `WorkDetail/` (`FE/src/pages/ProductDetail/index.jsx:6`); `ProjectDetail` lives in `WorkDetail/` (`FE/src/pages/WorkDetail/ProjectDetail.jsx`); `ProductBadge` imports the Products page stylesheet (`FE/src/pages/Products/ProductBadge.jsx:2`).
- [Fact] One concept has three names: `works` (API, files), `lens` (routes), "Behind the Lens" / "frames" (UI).
- [Fact] Embed and slug rules are written three times: `BE/src/validate.js:3-8`, `FE/src/pages/Admin/EntryForm.jsx:25-27`, `FE/src/pages/WorkDetail/media.js:4`.
- [Fact] Dead: `.home-badge` (`FE/src/pages/Home/Home.scss:201-206`), `FE/public/icons.svg` (5,031 bytes, no references, shipped to `dist`), `profile.tagline`, `@types/react` and `@types/react-dom` in a project with no TypeScript (`FE/package.json:25-26`; they do help editor hints).
- [Fact] `FE/src/pages/Admin/EntryForm.jsx` is 953 lines in one component file.
- [Fact] `FE/package.json` version is `0.0.0`; root is `1.1.0`.

Steps

1. Port `Works` and `WorkDetail` to `useFetch` (deps `[type]` and `[resource, slug]`), and render errors through `LoadState`, adding an optional `notFound` variant for the 404 copy.
2. Export `SITE = profile.name` from `FE/src/data/portfolio.js` and use it in the eight titles.
3. Move `Markdown.jsx` and `media.js` to `FE/src/lib/`; move `ProductBadge` and its styles to `FE/src/components/ui/`.
4. Delete `.home-badge`, `FE/public/icons.svg`, `profile.tagline`.
5. Leave the three-name issue and the `EntryForm` size alone unless a rebuild happens (section 5); renaming touches the DB table and MinIO bucket.

### T21. framer-motion out of the entry bundle

Findings

- [Fact] The entry chunk is 377.14 kB (121.73 kB gzip). It statically includes react-dom, react-router, framer-motion and react-icons.
- [Fact] framer-motion is imported in two places, both for the page transition: `FE/src/App.jsx:3` (`AnimatePresence`) and `FE/src/components/ui/PageTransition.jsx:1`.
- [Fact] The transition runs 250 ms out plus 250 ms in on every navigation (`PageTransition.jsx:5`).
- [Opinion] Half a second per click is noticeable for someone scanning five pages quickly.

Steps

1. Replace the shutter with the View Transitions API and move the shutter animation to `::view-transition-old(root)` / `::view-transition-new(root)` keyframes in `FE/src/components/ui/ui.scss:289-304`. Browsers without support get an instant swap, which is acceptable. Check the React Router docs before starting: the `viewTransition` prop on `Link`/`NavLink` is documented for data and framework routers, and this app uses the declarative `BrowserRouter` (`FE/src/main.jsx:9`), so this needs either a switch to `createBrowserRouter` + `RouterProvider` or a small wrapper that calls `document.startViewTransition(() => flushSync(() => navigate(to)))`.
2. Keep `onRouteSwap` behaviour (scroll to top, focus `main`, `App.jsx:58-61`) in a `useEffect` on `location.pathname`.
3. Remove `framer-motion` from `FE/package.json`; rebuild and compare the `index-*.js` gzip size against 121.73 kB.
4. If the motion is kept as is, at least shorten `half` to 0.15.

### T22. Trim the works list payload

Findings

- [Fact] List endpoints exclude only `heavy` columns, and for works that is `['body']` (`BE/src/app.js:32`, `BE/src/crud.js:38`). The live `/api/works` list returns the full `media` array for every row (17, 16 and 2 items).
- [Fact] List consumers use `cover_url`, `title`, `summary`, `date`, `type`, `shot_on`, `slug` only (`FE/src/pages/Works/index.jsx:113-122`, `FE/src/pages/Home/index.jsx:192-202`, `FE/src/pages/Works/works.js:7`).

Steps

1. Change to `heavy: ['body', 'media', 'links']` for works and projects in `BE/src/app.js:32,38`.
2. Update the list assertions in `BE/test/works.test.js` and `BE/test/content.test.js`, and the mock mirror `HEAVY` in `FE/src/lib/api.js:75`.

### T23. Stale docs and env examples

Findings

- [Fact] `README.md:45` points to `FE/src/pages/Contact.jsx`; the file is `FE/src/pages/Contact/index.jsx`.
- [Fact] Root `.env.example:1-23` describes a Docker-era setup (`POSTGRES_*`, `MINIO_ROOT_*`, DB user `jose`) and disagrees with `BE/.env.example:1` (DB user `joselie`, database `portfolio`). Docker was removed in commit `9d2c4d9`.
- [Fact] `PRODUCT.md:15-17,35` and `PLAN.md:27-41` still describe Docker Compose, Caddy, `@react-three/drei` and `/works` routes. None of those exist now.
- [Fact] README has no Node version, no FE lint/test commands, no link to the live site.

Steps

1. Fix the path in `README.md:45`; add a "Requirements" line (Node 22, Postgres, MinIO) and the FE `lint`/`test` commands.
2. Delete root `.env.example`.
3. Add a one-line banner at the top of `PLAN.md` and `PRODUCT.md`: "Historical build plan, not current. See README." or move them to `docs/archive/`.

### T24. Large binaries out of git

Findings

- [Fact] Tracked at the root: `JoseAndreasLie'sPortfolio.pdf` (6,456,722 bytes) and `ASSETS/badminton.jose.web.id/VideoPromotion.mp4` (4,396,751 bytes) plus `Thumbnail.jpg` (234,383 bytes). None are referenced by code or shipped.
- [Fact] The apostrophe in the PDF filename broke an unquoted `xargs` pipeline during this review ("unterminated quote").

Steps

1. Move both to cloud storage or a local folder outside the repo.
2. `git rm` them and add `ASSETS/` and `*.mp4` to `.gitignore`.
3. History rewrite is not worth it for 11 MB.

---

## 5. What I would do differently

Not tasks. These are choices I would change in a rebuild.

1. **Prerender the public pages.** [Opinion] A portfolio's public pages are static content. I would build them to HTML at deploy time (Astro, or Vite with a prerender step) so each URL ships its own title, description, Open Graph tags and content without JavaScript. Trade-off: content edits need a rebuild (a deploy hook from the admin solves it), and the page-transition and 3D hero need to be hydrated islands. Gain: per-page link previews, real 404 status codes, faster first paint, and it removes T03's "every link shares one preview" limit.

2. **Keep recruiter-critical content out of the database.** [Fact] Projects and products moved from `FE/src/data` into Postgres (`BE/db/migrations/0005-seed-content.cjs:1`), so Home's proof sections now depend on the API and DB being up (`FE/src/pages/Home/index.jsx:152-154`), and section 2 shows what happens when they drift. [Opinion] Four projects and three products that change a few times a year would be simpler as markdown or JSON in the repo: versioned, reviewable, no outage mode. I would keep the API and admin only for the photo and video feed, where uploads and frequent posting justify it. Trade-off: editing a project means a commit instead of a form.

3. **Static hosting for the front end.** [Opinion] Serve `FE/dist` from a CDN host (Cloudflare Pages, Netlify) and keep EC2 for the API only. Compression, HTTP/2 and 3, caching and TLS come configured, which removes T02 and most of T19 as manual nginx work. Trade-off: two deploy targets, and `/api` and `/media` need a proxy rule or a subdomain with CORS.

4. **One name for one thing.** [Opinion] Pick `lens` (or `works`) and use it in the table, the API path, the bucket, the folder and the route. Cheap at the start, expensive now.

5. **Recruiter-first information architecture.** [Opinion] Home would be: who and what in one sentence, CV and contact, three proof items with outcomes, then the creative work as a clearly secondary section. The "Signal & Frame" identity can stay as the visual layer; it should not decide the content order.

6. **CSS-only motion.** [Opinion] View Transitions and CSS keyframes cover the shutter, the hero entrance and the REC dot. That drops framer-motion and leaves three.js as the only heavy optional dependency.

7. **Types on the API boundary.** [Opinion] The brief says no TypeScript and I would respect that for the UI. I would still share one schema file (JSDoc typedefs or a small validation schema) between `BE/src/validate.js`, `FE/src/pages/Admin/EntryForm.jsx` and `FE/src/lib/mocks.js`, which today repeat the same field rules by hand.

---

## 6. Questions for Jose

1. ~~Is `1.1.0` meant to be live?~~ Answered 2026-11-15: no, not deployed yet. See T01.
2. Have you graduated? If yes, what should the education line say; if not, what is the new expected date?
3. Which role are you applying for first: project manager, fullstack, or backend? The site, the CV summary and the Contact page each say something slightly different.
4. Is it intended that your phone number is public on the site and in the repo (`FE/src/data/portfolio.js:11`)? Is the GitHub repo public?
5. Which projects have links you can publish (repos, App Store page for BuahHati, demo videos)? Are screenshots of the HRIS work allowed?
6. What is "Aftersix" in relation to PT Ganda Visi Jayatama and PT Visi Karya Nusantara? The Nine to Six project names a company that is not in your experience list.
7. How much of Echo's architecture can be described without identifying the client?
8. Does the live nginx config differ from the README on purpose (report-only CSP, `includeSubDomains`)? Can you paste `nginx -T` output for the site?
9. Is the EmailJS account restricted to `jose.web.id`, and what is the monthly quota?
10. What is `ASSETS/badminton.jose.web.id/VideoPromotion.mp4` for? The API accepts only YouTube and Vimeo embeds, so it would need uploading there to appear on the Badminton page.
11. Should photography have equal billing with engineering for recruiters, or is it supporting material? T10 assumes supporting.
12. Do you want visitor analytics? There is none in the code, so there is no way to know whether recruiters open the CV or the projects.
13. Do you want an Indonesian version for local visitors, or is English only correct?
14. Should `PLAN.md`, `PRODUCT.md`, `DESIGN.md` and `PORTFOLIO_BRIEF.md` stay at the repo root?
15. Is "No TypeScript" still a firm rule?

---

## 7. Considered but not recommended

- **Migrate to TypeScript.** The brief rules it out and the code is small and readable; shared schemas (section 5, item 7) get most of the benefit.
- **Rewrite in Next.js now.** It fixes SEO but replaces a working app; static tags (T03) now and prerendering later is cheaper.
- **Remove the three.js hero.** It is lazy, desktop-only, has a static fallback and pauses off screen (`FE/src/pages/Home/HeroScene.jsx:222-249`); the cost is contained.
- **`npm audit fix --force` in `BE`.** It would install `minio@7.1.3`, `sequelize-cli@6.6.2` or `sequelize@3.30.0`, all breaking downgrades for moderate transitive issues.
- **Upgrade `framer-motion` to 14 or `@emailjs/browser` to 5.** No feature or fix is needed from either; T21 removes one of them anyway.
- **Replace EmailJS with a custom mail endpoint.** More code and deliverability work to own; allowlist plus honeypot (T11) is enough at this volume.
- **Move the admin token to an httpOnly cookie.** Single admin, short XSS surface, and it would add CSRF handling; a CSP (T19) is the better spend.
- **Add React Query or a state library.** Three list fetches and one detail fetch; `useFetch` at 25 lines is the right size.
- **Add Tailwind or a component library.** The SCSS token system (`FE/src/styles/_tokens.scss`) is consistent and already complete.
- **Add API pagination.** Three frames, four projects, three products.
- **Drop `/admin` from `robots.txt` to hide it.** Security by obscurity; the login is rate limited (`BE/src/app.js:21-24`) and the page is `noindex` at nginx.
- **Add testimonials or a profile photo.** Both were declined on purpose in the brief (`PORTFOLIO_BRIEF.md:10,28`).
- **Add Prettier.** The code is already uniformly formatted; worth doing only if a second contributor joins.
- **Rewrite git history to purge the binaries.** 11 MB does not justify force-pushing `main`.
- **Split `EntryForm.jsx`.** It is long but admin-only, lazy loaded, and working; refactoring it has no visitor-facing benefit.
