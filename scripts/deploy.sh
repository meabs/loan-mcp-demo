#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/last-bookshop}"
LOANS_HEALTH_URL="${LOANS_HEALTH_URL:-http://127.0.0.1:3000/health}"

if [[ "$(pwd)" != "$APP_DIR" ]]; then
	echo "Run this script from $APP_DIR on the VPS."
	exit 1
fi

curl -fsS --max-time 10 "$LOANS_HEALTH_URL" >/dev/null
docker compose -p last-bookshop build
docker compose -p last-bookshop up -d
curl -fsS --max-time 10 http://127.0.0.1:3100/health
curl -fsS --max-time 10 "$LOANS_HEALTH_URL" >/dev/null
