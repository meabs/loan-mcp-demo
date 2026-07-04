# Greenbridge Loans MCP Demo

A ChatGPT MCP app demo for a fictional UK lender, **Greenbridge Bank**. It shows how an embedded ChatGPT app can guide a borrower through loan purpose selection, affordability exploration, illustrative product comparison, and next-step preparation.

The app is designed for a stakeholder demo. All lending data is mock data. It is not financial advice, a credit decision, or connected to customer records or bank systems.

## Local Development

```bash
npm install
npm run build
npm start
```

The local MCP endpoint is:

```text
http://127.0.0.1:3000/mcp
```

Health check:

```bash
curl http://127.0.0.1:3000/health
```

## ChatGPT Developer Mode

For the demo hostname, connect ChatGPT to:

```text
https://loan.mcp.meaburn.com/mcp
```

The server registers a React widget resource using the MCP Apps UI MIME type `text/html;profile=mcp-app`.

## MCP Tools

- `start_loan_journey`: starts the visual borrower journey.
- `calculate_affordability`: refreshes affordability estimates.
- `compare_loan_options`: ranks illustrative Greenbridge loan products.
- `prepare_application_checklist`: prepares documents, questions, and a handoff path.

All tools are read-only and idempotent for the demo.

## VPS Deployment

Target:

```text
Host: 77.68.54.81
User: root
Domain: loan.mcp.meaburn.com
Local service: http://127.0.0.1:3000
```

Do not commit server passwords, Cloudflare tunnel tokens, or private keys.

Recommended setup on the VPS:

```bash
apt-get update
apt-get install -y git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
mkdir -p /opt/greenbridge-loans
git clone https://github.com/meabs/loan-mcp-demo.git /opt/greenbridge-loans
cd /opt/greenbridge-loans
npm ci
npm run build
cp deploy/greenbridge-loans.service /etc/systemd/system/greenbridge-loans.service
systemctl daemon-reload
systemctl enable --now greenbridge-loans
```

Check it:

```bash
systemctl status greenbridge-loans --no-pager
curl http://127.0.0.1:3000/health
```

## Cloudflare Tunnel

Install `cloudflared` on the VPS using Cloudflare's current package instructions, then authenticate and create a tunnel:

```bash
cloudflared tunnel login
cloudflared tunnel create loan-mcp-demo
cloudflared tunnel route dns loan-mcp-demo loan.mcp.meaburn.com
```

Create `/etc/cloudflared/config.yml`:

```yaml
tunnel: loan-mcp-demo
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: loan.mcp.meaburn.com
    service: http://127.0.0.1:3000
  - service: http_status:404
```

Run it as a service:

```bash
cloudflared service install
systemctl enable --now cloudflared
cloudflared tunnel info loan-mcp-demo
```

## Optional Auto Deploy

`.github/workflows/deploy.yml` deploys on push to `main` when these GitHub Actions secrets are configured:

- `VPS_HOST`: `77.68.54.81`
- `VPS_USER`: `root`
- `VPS_SSH_KEY`: private deploy key authorized on the VPS
- `VPS_APP_PATH`: `/opt/greenbridge-loans`

The workflow pulls the latest commit, runs `npm ci`, builds the app, and restarts the `greenbridge-loans` systemd service.

Password-based SSH is intentionally not automated.
