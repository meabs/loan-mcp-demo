#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/last-bookshop/backups}"
DATABASE_PATH="${DATABASE_PATH:-/var/lib/docker/volumes/last-bookshop-data/_data/last-bookshop.sqlite}"
mkdir -p "$BACKUP_DIR"
if [[ -f "$DATABASE_PATH" ]]; then
	cp "$DATABASE_PATH" "$BACKUP_DIR/last-bookshop-$(date -u +%Y%m%dT%H%M%SZ).sqlite"
else
	echo "No database found at $DATABASE_PATH"
fi
