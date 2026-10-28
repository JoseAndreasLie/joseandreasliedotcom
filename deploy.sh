#!/usr/bin/env bash
# Usage: npm run deploy   (needs an `aws` host in ~/.ssh/config; one-time server setup in README)
set -euo pipefail
cd "$(dirname "$0")"

APP=/var/www/jose.web.id

npm --prefix FE ci
npm --prefix FE run build

# Server .env is excluded, so --delete never touches it.
rsync -az --delete --exclude node_modules --exclude .env --exclude test \
  BE/ "aws:$APP/server/"
# Old hashed assets are kept so open tabs don't 404 on lazy chunks.
rsync -az --delete --filter='P assets/**' FE/dist/ "aws:$APP/web/dist/"

# npm ci on the server: sharp needs Linux binaries.
ssh aws "cd $APP/server && npm ci --omit=dev && pm2 restart jose-api"
