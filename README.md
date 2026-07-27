# Jose Andreas Lie — Portfolio

React + Vite portfolio site. SCSS, React Router, Framer Motion, EmailJS contact form, dark/light theme toggle.

## Develop

```bash
npm install
npm run dev
```

## Contact form setup

Create an [EmailJS](https://www.emailjs.com/) account, then copy `.env.example` to `.env` and fill in:

```
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

The template should accept `user_name`, `user_email`, and `message` fields (see `src/pages/Contact.jsx`).

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. If deploying to `https://<user>.github.io/<repo>/` (not a custom domain), set `base: '/<repo>/'` in `vite.config.js`.
3. Run:

```bash
npm run deploy
```

This builds the site and publishes `dist/` to the `gh-pages` branch via the `gh-pages` package.
