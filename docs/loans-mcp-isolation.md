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

## Required Last Bookshop resources

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

## Collision check

Based on live VPS discovery:

| Area | Collision status | Notes |
| --- | --- | --- |
| Deployment path | No collision | `/opt/last-bookshop` does not exist |
| Public hostname | No live DNS collision found | `games-mcp.meaburn.com` does not resolve |
| Internal port | No collision | `3100` is not bound |
| systemd service | No collision | No `last-bookshop` service exists |
| Docker container | No collision, but Docker absent | Docker must be installed before Compose deployment |
| Docker network | No collision, but Docker absent | Docker must be installed before Compose deployment |
| Docker volume | No collision, but Docker absent | Docker must be installed before Compose deployment |
| Cloudflare ingress | No route exists yet | Existing remote ingress routes Loans hostnames to `127.0.0.1:3000` |

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

## After-change verification requirement

After every shared-infrastructure change, repeat the Loans health check and verify the Loans process or container has not restarted unexpectedly.

No after-change verification exists yet because no shared infrastructure has been changed.

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

No live resource collision was found for the required Last Bookshop path, hostname, internal port, container name, network name, volume name, or database path. Phase 1 local implementation can proceed. Phase 4 deployment must explicitly account for Docker being absent, and Phase 5 routing must use Cloudflare remote tunnel management rather than a local config edit.
