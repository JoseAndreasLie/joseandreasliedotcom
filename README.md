# Jose Andreas Lie — Portfolio

React + Vite portfolio site. SCSS, React Router, Framer Motion, EmailJS contact form, dark/light theme toggle.

## Layout

- `FE/`: React + Vite site, served at `jose.web.id`
- `BE/`: Node + Express API, served at `jose.web.id/api` (port 4000)

## Develop

```bash
cd FE
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:4000` in dev.

## Contact form setup

Create an [EmailJS](https://www.emailjs.com/) account, then copy `FE/.env.example` to `FE/.env` and fill in:

```
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

The template should accept `user_name`, `user_email`, and `message` fields (see `FE/src/pages/Contact.jsx`).

## Deploy

FE and API both run on AWS EC2. Caddy serves the `FE/dist` build at `jose.web.id` and reverse proxies `/api/*` to the API on port 4000. See `PORTFOLIO_BRIEF.md` section 5.
