# Cloudflare Current State

Last updated: 2026-07-05

## Confirmed live setup

`cloudflared` runs as a systemd service:

```text
cloudflared.service loaded active running
ExecStart=/usr/bin/cloudflared --no-autoupdate tunnel run --token [REDACTED]
```

There is no local `/etc/cloudflared/config.yml`:

```text
sed: can't read /etc/cloudflared/config.yml: No such file or directory
```

`/etc/cloudflared` does not exist.

The tunnel is remotely managed. Cloudflared logs show tunnel ID `18142af2-3ece-4764-9f95-d761e70061dd`.

Initial remote ingress configuration:

```json
{
	"ingress": [
		{
			"hostname": "loan.mcp.meaburn.com",
			"service": "http://127.0.0.1:3000"
		},
		{
			"hostname": "loan-mcp.meaburn.com",
			"service": "http://127.0.0.1:3000"
		},
		{
			"service": "http_status:404"
		}
	],
	"warp-routing": {
		"enabled": false
	}
}
```

Cloudflared version:

```text
cloudflared version 2026.6.1
```

Cloudflared metrics port:

```text
127.0.0.1:20241
```

## Public route checks

Initial checks from this environment:

| Hostname | Result |
| --- | --- |
| `loan.mcp.meaburn.com` over HTTP | Cloudflare returns `301 Moved Permanently` to HTTPS |
| `loan.mcp.meaburn.com` over HTTPS | TLS handshake failure from local curl |
| `games-mcp.meaburn.com` | DNS resolution failed |

The missing DNS result for `games-mcp.meaburn.com` suggests the Last Bookshop route is not currently active publicly, but this is not enough to modify Cloudflare safely.

## Applied Last Bookshop route

```text
games-mcp.meaburn.com -> http://127.0.0.1:3100
```

The route was added through Cloudflare remote tunnel configuration without replacing either Loans ingress entry. A backup of the prior tunnel configuration was saved on the VPS under:

```text
/root/cloudflare-tunnel-config-backups/
```

Current remote ingress order:

```json
[
	{
		"hostname": "loan.mcp.meaburn.com",
		"service": "http://127.0.0.1:3000"
	},
	{
		"hostname": "loan-mcp.meaburn.com",
		"service": "http://127.0.0.1:3000"
	},
	{
		"hostname": "games-mcp.meaburn.com",
		"service": "http://127.0.0.1:3100"
	},
	{
		"service": "http_status:404"
	}
]
```

The proxied DNS record `games-mcp.meaburn.com` was created as a CNAME to the tunnel.

Post-change checks:

| Endpoint | Result |
| --- | --- |
| `https://games-mcp.meaburn.com/health` | healthy |
| `GET https://games-mcp.meaburn.com/mcp` | `405`, expected because MCP requires POST |
| `POST https://games-mcp.meaburn.com/mcp` initialize | returned `serverInfo.name` as `the-last-bookshop` |
| VPS-local Loans health | healthy |
| `greenbridge-loans` PID/start time | unchanged |
| `cloudflared` PID/start time | unchanged |

## Required safe Cloudflare workflow

For the current remotely managed tunnel:

1. Do not edit `/etc/cloudflared/config.yml`; it does not exist.
2. Use Cloudflare remote tunnel management to add only `games-mcp.meaburn.com -> http://127.0.0.1:3100`.
3. Preserve both existing Loans hostnames and the catch-all `http_status:404`.
4. If changing the token-run systemd unit is ever required, back up `/etc/systemd/system/cloudflared.service` first and redact the token in all documentation.
5. Reload or restart only `cloudflared` if Cloudflare requires it; do not restart `greenbridge-loans`.
6. Immediately health-check Loans locally and publicly, then health-check Last Bookshop.

## Current conclusion

Cloudflare is remotely managed through a token-run tunnel. The game route has been appended ahead of the catch-all while preserving both Loans routes. No cloudflared restart was required.
