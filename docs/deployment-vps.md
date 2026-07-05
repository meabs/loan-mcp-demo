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

Docker is now installed on the VPS for the Last Bookshop deployment.

Loans MCP is a systemd Node process on port `3000`. Do not restart or rebuild it.

## Completed Deployment

The Last Bookshop was deployed from GitHub commit `0370f62`.

```text
Directory: /opt/last-bookshop
Compose project: last-bookshop
Container: last-bookshop-server
Network: last-bookshop-net
Volume: last-bookshop-data
Local health: http://127.0.0.1:3100/health
Public health: https://games-mcp.meaburn.com/health
MCP endpoint: https://games-mcp.meaburn.com/mcp
```

The production `.env` exists only at `/opt/last-bookshop/.env` on the VPS and is not committed.

Last successful public MCP smoke test:

```text
POST https://games-mcp.meaburn.com/mcp initialize
serverInfo.name: the-last-bookshop
serverInfo.version: 0.1.0
```

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

## Separate Update Paths

Update Loans separately:

```bash
cd /opt/greenbridge-loans
# Use the existing Loans deployment workflow only.
systemctl status greenbridge-loans
```

Update Last Bookshop separately:

```bash
cd /opt/last-bookshop
git pull
docker compose -p last-bookshop build
docker compose -p last-bookshop up -d
curl -fsS http://127.0.0.1:3100/health
```

Do not run Docker Compose commands from `/opt/greenbridge-loans`, and do not use `docker compose down` outside `/opt/last-bookshop`.

## Rollback

Use `scripts/rollback.sh` from `/opt/last-bookshop`. It stops only `last-bookshop-server`.
