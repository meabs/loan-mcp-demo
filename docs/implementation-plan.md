# The Last Bookshop Implementation Plan

Last updated: 2026-07-05

## Phase 0 status

Phase 0 is in discovery only. No application deployment, container lifecycle command, Cloudflare edit, systemd command, database migration, or Loans MCP source change has been made.

## Current OpenAI guidance reviewed

Official OpenAI Apps SDK documentation reviewed before coding:

- Apps SDK quickstart: `https://developers.openai.com/apps-sdk/quickstart`
- Build an MCP server: `https://developers.openai.com/apps-sdk/build/mcp-server`
- Build a ChatGPT UI: `https://developers.openai.com/apps-sdk/build/chatgpt-ui`
- Tool planning: `https://developers.openai.com/apps-sdk/plan/tools`
- Apps SDK reference: `https://developers.openai.com/apps-sdk/reference`
- Deployment: `https://developers.openai.com/apps-sdk/deploy`
- Submission guidance: `https://developers.openai.com/apps-sdk/deploy/submission`
- Official examples overview: `https://developers.openai.com/apps-sdk/build/examples`

Relevant guidance for this app:

- Use a decoupled architecture: MCP tools own state and rules; the React widget renders structured state.
- Tool descriptions should start with "Use this when..." and tools should be focused around one job.
- Use `structuredContent` for model-safe public state, `_meta` for widget-only values such as resume tokens, and concise `content` for ChatGPT narration.
- Version widget resource URIs because ChatGPT can cache resources.
- Use exact widget CSP and production domain metadata.
- Keep hidden state, token hashes, scoring weights, and internal state out of model-visible tool results.

## Selected archetype

Primary archetype: submission-ready interactive React widget with a decoupled MCP data and rendering architecture.

The server owns:

- anonymous world creation and resume tokens
- SQLite persistence
- Edith's authored answers
- book availability
- deterministic scoring
- version/concurrency checks
- rewards and immutable result storage

ChatGPT owns:

- narration
- helping the player understand the scene
- acting as Avery Quill, the rival bookseller, through `submit_rival_recommendation`

The widget owns:

- mobile-first visual scene
- semantic controls
- local pending/error UI states
- calling MCP tools through the Apps bridge

## Upstream example choice

Use the official OpenAI Apps SDK examples as the closest upstream baseline, with the Pizzaz React examples as the UI/data pattern and the quickstart/server documentation as the MCP wiring pattern.

Reason:

- The Last Bookshop needs a rich interactive React widget, not only a static HTML component.
- The official examples demonstrate Apps SDK resource registration, tool result driven UI, and widget bridge behaviour.
- The game state should stay server-side; the UI should consume public scene state and dispatch explicit tool actions.

More detail is recorded in `docs/upstream-example.md`.

## Local repository approach

The current repository is the Greenbridge Loans MCP demo. Phase 0 does not scaffold Last Bookshop code into this repository yet.

When Phase 1 begins, create a separate Last Bookshop application structure from the requested layout and keep all Loans MCP files untouched unless the user explicitly chooses a new repository. The eventual VPS deployment path must be `/opt/last-bookshop`, not `/opt/greenbridge-loans`.

Package manager: npm workspaces.

Reason:

- The current repo already uses `package-lock.json` and npm scripts.
- npm workspaces satisfy the requested monorepo layout without mixing package managers.
- It avoids introducing pnpm-specific lockfiles or runtime assumptions.

## Implementation phases

1. Phase 0: finish direct VPS inventory once credentials are available; confirm Loans MCP deployment and Cloudflare Tunnel configuration from the server itself.
2. Phase 1: scaffold npm workspaces, shared contracts, MCP server, React/Vite widget, health endpoint, SQLite repository abstraction, placeholder visual manifest, Docker files, and local docs.
3. Phase 2: implement the playable Edith Vale encounter, authored question responses, book selection, Avery recommendation tool, deterministic scoring, and persistence.
4. Phase 3: add unit, integration, security, and widget tests; add structured logging, counters, rate limits, redaction, and typed errors.
5. Phase 4: install Docker if still absent and approved at execution time, then deploy only to `/opt/last-bookshop` with Compose project `last-bookshop`, container `last-bookshop-server`, network `last-bookshop-net`, volume `last-bookshop-data`, and internal port `3100`.
6. Phase 5: add only the Cloudflare route `games-mcp.meaburn.com -> http://127.0.0.1:3100`, preserving every existing ingress rule and keeping the catch-all last.
7. Phase 6: verify MCP Inspector, ChatGPT developer mode, one full encounter, restart/resume persistence, public health/MCP endpoints, and unchanged Loans MCP health.

## Phase 0 infrastructure finding

Direct VPS inspection is now complete enough for an isolation decision. Confirmed live findings:

- Loans MCP is a Node.js systemd service named `greenbridge-loans`.
- Loans MCP runs from `/opt/greenbridge-loans`.
- Loans MCP listens on port `3000`.
- `http://127.0.0.1:3000/health` returns healthy JSON on the VPS.
- `/opt/last-bookshop` does not exist.
- Port `3100` is not bound.
- Docker is not installed on the VPS.
- Cloudflare Tunnel runs as a systemd service using a token-managed tunnel, not a local `/etc/cloudflared/config.yml`.
- Current remote-managed ingress contains Loans hostnames pointing at `http://127.0.0.1:3000`.
- `games-mcp.meaburn.com` does not currently resolve.

Phase 1 local implementation can proceed without touching VPS infrastructure. Phase 4 deployment will require Docker installation because Docker is absent; the user has said Docker can be installed if helpful, but that remains a deployment-phase infrastructure change and was not performed in Phase 0. Phase 5 Cloudflare routing will require updating the remotely managed tunnel route through Cloudflare, because there is no local config file to edit safely.
