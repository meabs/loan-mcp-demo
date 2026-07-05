# VPS Inventory

Last updated: 2026-07-05

## Evidence levels

This inventory separates confirmed live VPS facts from repository documentation.

## Access result

Target from repository documentation:

```text
Host: 77.68.54.81
User: root
```

Read-only SSH access was used for inventory only:

```text
ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/tmp/last-bookshop-known-hosts -o ConnectTimeout=8 root@77.68.54.81 'hostname'
```

Initial result before credentials were supplied:

```text
root@77.68.54.81: Permission denied (publickey,password).
```

After credentials were supplied, read-only inventory succeeded.

Host identity:

```text
hostname: ubuntu
time: 2026-07-05T13:36:33+00:00
kernel: Linux ubuntu 7.0.0-27-generic x86_64
```

No VPS system files, Docker state, systemd state, volumes, networks, Cloudflare configuration, credentials, or application directories were changed.

## Confirmed live Loans MCP deployment

| Item | Confirmed value | Evidence |
| --- | --- | --- |
| Application | Greenbridge Loans MCP Demo | `greenbridge-loans.service` |
| Host | `77.68.54.81` | SSH inventory |
| Hostname | `ubuntu` | SSH inventory |
| Deployment directory | `/opt/greenbridge-loans` | systemd unit and directory listing |
| Runtime | Node.js via systemd | systemd unit |
| systemd service | `greenbridge-loans` | systemd inventory |
| Service state | active/running | `systemctl show` |
| Main PID | `6002` at inventory time | `systemctl show` |
| Active since | `Sat 2026-07-04 12:39:03 UTC` | `systemctl show` |
| Internal port | `3000` | systemd unit and `ss -ltnp` |
| Port bind | `*:3000` by `node` PID `6002` | `ss -ltnp` |
| Local health endpoint | `http://127.0.0.1:3000/health` | health check |
| Local health result | `{"ok":true,"service":"greenbridge-loans","mcp":"/mcp"}` | health check |
| Public hostname | `loan.mcp.meaburn.com` | Cloudflare ingress logs |
| Secondary hostname | `loan-mcp.meaburn.com` | Cloudflare ingress logs |
| Environment files | none found under `/opt/greenbridge-loans` max depth 2 | `find` |
| Docker usage | none; Docker command not found | Docker check |
| Database | none found or documented | repository and VPS inventory |

Systemd unit:

```text
WorkingDirectory=/opt/greenbridge-loans
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=PUBLIC_BASE_URL=https://loan.mcp.meaburn.com
ExecStart=/usr/bin/node server/dist/index.js
Restart=always
```

## Confirmed live services

```text
cloudflared-update.service  loaded inactive dead    Update cloudflared
cloudflared.service         loaded active   running cloudflared
greenbridge-loans.service   loaded active   running Greenbridge Loans MCP Demo
```

Docker:

```text
bash: line 1: docker: command not found
```

No Docker containers, Compose projects, Docker networks, or Docker volumes exist because Docker is not installed.

## Confirmed live port bindings

```text
127.0.0.53:53        systemd-resolve
127.0.0.1:20241      cloudflared metrics
127.0.0.54:53        systemd-resolve
0.0.0.0:22           sshd
*:3000               node, greenbridge-loans
[::]:22              sshd
```

Port `3100` is free at inventory time.

## Confirmed filesystem state

```text
/opt                      exists
/opt/greenbridge-loans    exists
/opt/last-bookshop        does not exist
/etc/cloudflared          does not exist
```

No `.env`-like files were found under `/opt/greenbridge-loans` at max depth 2.

No reverse proxy files were found under `/etc/nginx`, `/etc/caddy`, or `/etc/apache2`.

## Local repository state

Current working tree has uncommitted Loans MCP changes:

```text
M server/src/index.ts
M server/src/lending.ts
M web/src/main.tsx
M web/src/styles.css
```

These were not reverted or edited during Phase 0.

## Endpoint checks

Public checks from this environment:

| Endpoint | Result |
| --- | --- |
| `http://loan.mcp.meaburn.com/health` | Cloudflare HTTP 301 to HTTPS |
| `https://loan.mcp.meaburn.com/health` | TLS handshake failure from local curl |
| `http://loan.mcp.meaburn.com/mcp` | Cloudflare HTTP 301 to HTTPS |
| `https://loan.mcp.meaburn.com/mcp` | TLS handshake failure from local curl |
| `https://games-mcp.meaburn.com/health` | DNS resolution failed |

VPS-local checks:

```text
http://127.0.0.1:3000/health -> {"ok":true,"service":"greenbridge-loans","mcp":"/mcp"}
http://127.0.0.1:3100/health -> connection refused
https://games-mcp.meaburn.com/health -> DNS resolution failed
```

Public Loans HTTPS health failed from both local and VPS curl with a TLS handshake failure. The VPS-local Loans health endpoint is healthy.

## Required live inventory before deployment

Before Phase 4 deployment, re-run this inventory because the VPS may change:

- `systemctl show greenbridge-loans cloudflared`
- `ss -ltnp`
- `command -v docker; docker ps`
- Loans local health check
- Cloudflare route state

## Phase 0 conclusion

No direct resource collision was found for `/opt/last-bookshop` or port `3100`. Docker is absent, so Docker-based deployment cannot proceed until Docker installation is explicitly approved. Cloudflare is token-managed and remotely configured, so route changes cannot be made by editing a local config file.
