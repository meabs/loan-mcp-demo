# VPS Deployment

Target:

```text
Project directory: /opt/last-bookshop
Compose project: last-bookshop
Container: last-bookshop-server
Network: last-bookshop-net
Volume: last-bookshop-data
Internal port: 3100
Database: /data/last-bookshop.sqlite
Public hostname: games-mcp.meaburn.com
```

## Current VPS Finding

Docker is not installed on the VPS. The user has said Docker can be installed if helpful, but that is a deployment-phase infrastructure change and was not performed in Phase 0.

Loans MCP is a systemd Node process on port `3000`. Do not restart or rebuild it.

## Safe Deployment Sequence

1. Re-check Loans health: `curl -fsS --max-time 10 http://127.0.0.1:3000/health`.
2. Install Docker only if still absent and explicitly proceeding with deployment.
3. Create `/opt/last-bookshop`.
4. Copy only Last Bookshop files.
5. Create `/opt/last-bookshop/.env` from `.env.example`.
6. Run `docker compose -p last-bookshop build`.
7. Run `docker compose -p last-bookshop up -d`.
8. Check `http://127.0.0.1:3100/health`.
9. Re-check Loans health.
10. Add `games-mcp.meaburn.com -> http://127.0.0.1:3100` in the remotely managed Cloudflare Tunnel.
11. Verify public `/health` and `/mcp`.
12. Re-check Loans health and service start timestamp.

## Rollback

Use `scripts/rollback.sh` from `/opt/last-bookshop`. It stops only `last-bookshop-server`.

