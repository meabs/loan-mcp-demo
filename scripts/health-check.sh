#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3100}"
curl -fsS --max-time 10 "$BASE_URL/health"
printf '\n'
