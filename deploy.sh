#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Fall back to EC2_HOST from .env if not exported.
if [ -z "${EC2_HOST:-}" ] && [ -f .env ]; then
  EC2_HOST="$(grep -E '^EC2_HOST=' .env | cut -d= -f2- || true)"
fi
: "${EC2_HOST:?EC2_HOST is not set (e.g. EC2_HOST=ubuntu@1.2.3.4 ./deploy.sh)}"

(cd FE && npm ci && npm run build)

# Ship tracked files + FE/dist. .env* never shipped (server .env is protected from --delete).
# Old hashed assets are kept so open tabs don't 404 on lazy chunks.
rsync -az --delete \
  --filter='P /FE/dist/assets/**' \
  --include='/FE/dist/***' \
  --exclude='.env*' --exclude='.git/' --exclude='.claude/' --exclude='node_modules/' \
  --exclude="/JoseAndreasLie'sPortfolio.pdf" \
  --filter=':- .gitignore' \
  ./ "$EC2_HOST:~/jose.web.id/"

ssh "$EC2_HOST" 'cd ~/jose.web.id && docker compose -f docker-compose.yml up -d --build --remove-orphans'
