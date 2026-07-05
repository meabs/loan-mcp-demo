# Loans MCP Isolation Plan

Last updated: 2026-07-05

## Operating rule

The Loans MCP is protected infrastructure. The Last Bookshop must not modify, restart, rebuild, reconfigure, or share mutable runtime resources with the Loans MCP.

## Confirmed live Loans MCP resources

The current VPS runs Loans MCP as:

| Resource | Loans MCP documented value |
| --- | --- |
| Deployment path | `/opt/greenbridge-loans` |
| Public hostnames | `loan.mcp.meaburn.com`, `loan-mcp.meaburn.com` |
| Runtime | Node.js systemd service |
| systemd service | `greenbridge-loans` |
| Internal port | `3000` |
| Local service | `http://127.0.0.1:3000` |
| Database | none documented |
| Docker container | none; Docker is not installed |
| Docker network | none; Docker is not installed |
| Docker volume | none; Docker is not installed |
| Cloudflare Tunnel | `cloudflared.service`, token-managed remote ingress |
| Cloudflare metrics port | `127.0.0.1:20241` |

## Deployed Last Bookshop resources

The Last Bookshop must use only these dedicated resources:

| Resource | Last Bookshop required value |
| --- | --- |
| Deployment path | `/opt/last-bookshop` |
| Compose project | `last-bookshop` |
| Container | `last-bookshop-server` |
| Network | `last-bookshop-net` |
| Volume | `last-bookshop-data` |
| Internal port | `3100` |
| Database | `/data/last-bookshop.sqlite` |
| Public hostname | `games-mcp.meaburn.com` |

## Deployment collision check

Based on live VPS discovery and deployment verification:

| Area | Collision status | Notes |
| --- | --- | --- |
| Deployment path | No collision | `/opt/last-bookshop` is used only by Last Bookshop |
| Public hostname | No collision | `games-mcp.meaburn.com` routes only to Last Bookshop |
| Internal port | No collision | `3100` is bound only by `last-bookshop-server` on `127.0.0.1` |
| systemd service | No collision | No `last-bookshop` service exists |
| Docker container | No collision | Only `last-bookshop-server` was created |
| Docker network | No collision | Only `last-bookshop-net` was created |
| Docker volume | No collision | Only `last-bookshop-data` was created |
| Cloudflare ingress | No collision | Existing Loans hostnames still route to `127.0.0.1:3000`; game hostname routes to `127.0.0.1:3100` |

## Baseline requirement

Captured Phase 0 baseline:

```text
greenbridge-loans state: active/running
greenbridge-loans MainPID: 6002 at inventory time
greenbridge-loans ActiveEnterTimestamp: Sat 2026-07-04 12:39:03 UTC
local health: {"ok":true,"service":"greenbridge-loans","mcp":"/mcp"}
Docker: command not found
```

Because Loans MCP is not containerized, `docker inspect <loans-container>` is not applicable.

## After-change verification

After Docker installation:

```text
Loans health: {"ok":true,"service":"greenbridge-loans","mcp":"/mcp"}
greenbridge-loans MainPID: 6002
greenbridge-loans ActiveEnterTimestamp: Sat 2026-07-04 12:39:03 UTC
```

After Last Bookshop container start:

```text
Last Bookshop health: {"ok":true,"service":"the-last-bookshop","mcp":"/mcp","database":"sqlite",...}
Loans health: {"ok":true,"service":"greenbridge-loans","mcp":"/mcp"}
greenbridge-loans MainPID: 6002
greenbridge-loans ActiveEnterTimestamp: Sat 2026-07-04 12:39:03 UTC
```

After Cloudflare route update:

```text
Public Last Bookshop health: https://games-mcp.meaburn.com/health -> healthy
Public Last Bookshop MCP initialize: POST https://games-mcp.meaburn.com/mcp -> serverInfo.name "the-last-bookshop"
Loans health: {"ok":true,"service":"greenbridge-loans","mcp":"/mcp"}
greenbridge-loans MainPID: 6002
greenbridge-loans ActiveEnterTimestamp: Sat 2026-07-04 12:39:03 UTC
cloudflared MainPID: 4561
cloudflared ActiveEnterTimestamp: Sat 2026-07-04 10:34:08 UTC
```

## Stop conditions

Stop before deployment if any of the following are true:

- `/opt/last-bookshop` already exists and is not clearly owned by this project.
- Port `3100` is already bound.
- A container named `last-bookshop-server` already exists.
- A Docker network named `last-bookshop-net` already exists for another workload.
- A Docker volume named `last-bookshop-data` already exists for another workload.
- Adding `games-mcp.meaburn.com` would require replacing or interrupting the Loans Cloudflare ingress rule.
- Cloudflare Tunnel is remotely managed and cannot be safely edited from the VPS.
- Loans MCP health is not green before the change.
- Authentication or visibility is insufficient to prove isolation.
- Docker installation cannot be approved as safe.
- The remotely managed Cloudflare route cannot be updated without replacing or interrupting Loans ingress.

## Current conclusion

The deployed game and the Loans MCP are isolated by path, process manager, port, runtime, public hostname, Docker container, Docker network, Docker volume, and database. Loans can continue to be updated through `/opt/greenbridge-loans` and `greenbridge-loans.service`; the game can be updated separately through `/opt/last-bookshop` and `docker compose -p last-bookshop`.
