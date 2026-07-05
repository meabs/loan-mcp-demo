# Build Status

Last updated: 2026-07-05

## Current State

The vertical slice is implemented, committed, pushed, and deployed to the VPS.

Implemented:

- npm workspace structure
- shared Zod contracts
- authored content
- MCP server and widget resource registration
- seven required tool handlers
- SQLite repository
- deterministic scoring
- React widget vertical slice
- Docker/Compose files
- deployment helper scripts
- required planning, privacy, security, and deployment docs

Verified locally:

- `npm install`
- `npm run build:bookshop`
- `npm run build`
- `npm run check`
- local `/health` smoke test on `http://127.0.0.1:3100/health`
- local Docker image build: `docker build -t last-bookshop-local:latest .`
- local Docker container smoke test on `http://127.0.0.1:3100/health`
- bookshop pixel-art sprites copied into `apps/widget/public/assets/bookshop/`
- cat pixel-art sprites copied into `apps/widget/public/assets/cats/`

Verified on VPS:

- GitHub commit deployed: `0370f62 Add Last Bookshop ChatGPT app`
- Docker installed without restarting Loans MCP
- Last Bookshop cloned to `/opt/last-bookshop`
- `.env` created only on the VPS and not committed
- Docker Compose project: `last-bookshop`
- Container: `last-bookshop-server`
- Network: `last-bookshop-net`
- Volume: `last-bookshop-data`
- Port binding: `127.0.0.1:3100->3100`
- VPS-local game health: `http://127.0.0.1:3100/health`
- Public game health: `https://games-mcp.meaburn.com/health`
- Public MCP initialize smoke test: `POST https://games-mcp.meaburn.com/mcp`

Not yet completed:

- MCP Inspector manual test
- ChatGPT developer mode end-to-end game test

## Loans MCP Status

The Loans MCP remained separate and healthy after Docker installation, Last Bookshop deployment, and Cloudflare route update.

Latest verification:

- Loans path: `/opt/greenbridge-loans`
- Loans service: `greenbridge-loans`
- Loans local port: `3000`
- Loans health: `{"ok":true,"service":"greenbridge-loans","mcp":"/mcp"}`
- Loans MainPID: `6002`
- Loans active since: `Sat 2026-07-04 12:39:03 UTC`
- No Loans source, service, deployment path, database, port, Docker resource, or Cloudflare hostname was changed.
