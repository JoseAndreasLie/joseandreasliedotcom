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

```bash
npm run deploy
```

Builds the FE locally, rsyncs `BE/` and `FE/dist/` to the `aws` ssh host under `/var/www/jose.web.id/`, then runs `npm ci --omit=dev` and `pm2 restart jose-api` there. nginx serves the FE, proxies `/api` to the API and `/media` to MinIO. Postgres and MinIO run natively on the same box.

### One-time server setup

1. Dirs:
   ```bash
   sudo mkdir -p /var/www/jose.web.id/{server,web/dist} && sudo chown -R $USER /var/www/jose.web.id
   ```
2. Postgres (prompts for the password):
   ```bash
   sudo -u postgres createuser joselie -P
   sudo -u postgres createdb -O joselie portfolio
   ```
3. MinIO: install `minio` and `mc`, run as a systemd service with `minio server /var/lib/minio --address 127.0.0.1:9000 --console-address 127.0.0.1:9001`. Then create the `works` bucket (anonymous GetObject only, no listing) and an upload-only `api-uploader` user. Its secret must differ from the root password:
   ```bash
   mc alias set local http://127.0.0.1:9000 <root user> <root password>
   mc mb --ignore-existing local/works
   echo '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::works/*"]}]}' > /tmp/public-read.json
   mc anonymous set-json /tmp/public-read.json local/works
   echo '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:PutObject"],"Resource":["arn:aws:s3:::works/*"]}]}' > /tmp/api-put.json
   mc admin policy create local api-put /tmp/api-put.json
   mc admin user add local api-uploader <api secret>
   mc admin policy attach local api-put --user api-uploader
   ```
4. Run `npm run deploy` once (the pm2 restart at the end fails the first time, that's expected), then:
   ```bash
   psql -U joselie -h localhost portfolio -f /var/www/jose.web.id/server/db/schema.sql
   ```
5. Create `/var/www/jose.web.id/server/.env` from `BE/.env.example`. Set `DATABASE_URL` with your Postgres password (URL-encode special characters), `JWT_SECRET` (`openssl rand -hex 32`), `ADMIN_PASSWORD_HASH` (`npm run hash-password` in `BE`), `MINIO_ENDPOINT=127.0.0.1`, the `api-uploader` keys, and a free `PORT` (e.g. `4100`). Deploys never overwrite this file.
6. Start the API once with pm2:
   ```bash
   cd /var/www/jose.web.id/server && pm2 start npm --name jose-api -- start && pm2 save
   ```
7. nginx site `/etc/nginx/sites-available/jose.web.id`, symlink into `sites-enabled`, `sudo nginx -t && sudo systemctl reload nginx`, then `sudo certbot --nginx -d jose.web.id`:
   ```nginx
   server {
     listen 80;
     server_name jose.web.id;
     root /var/www/jose.web.id/web/dist;

     add_header Strict-Transport-Security "max-age=31536000" always;
     add_header X-Content-Type-Options nosniff always;
     add_header X-Frame-Options DENY always;
     add_header Referrer-Policy strict-origin-when-cross-origin always;
     server_tokens off;
     gzip on;
     gzip_types text/css application/javascript application/json image/svg+xml;

     location / {
       try_files $uri /index.html;
     }
     location /assets/ {
       add_header Cache-Control "public, max-age=31536000, immutable";
     }
     location /admin {
       add_header X-Robots-Tag noindex;
       try_files $uri /index.html;
     }
     location /api/ {
       client_max_body_size 20m;
       proxy_pass http://127.0.0.1:4100;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
     location /media/ {
       limit_except GET { deny all; }
       proxy_pass http://127.0.0.1:9000/works/;
     }
   }
   ```
   Match the `4100` in `/api/` to `PORT` in the server `.env`. To add a CSP later, hash the inline theme `<script>` in `FE/index.html` and allow it via `script-src`.
