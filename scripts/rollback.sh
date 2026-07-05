#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/last-bookshop}"
if [[ "$(pwd)" != "$APP_DIR" ]]; then
	echo "Run this script from $APP_DIR on the VPS."
	exit 1
fi

docker compose -p last-bookshop stop last-bookshop-server
echo "Stopped only last-bookshop-server. Loans MCP was not touched."
