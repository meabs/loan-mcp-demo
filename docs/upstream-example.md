# Upstream Example Selection

Last updated: 2026-07-05

## Selected upstream baseline

Use the official OpenAI Apps SDK examples repository patterns, especially the Pizzaz React examples, as the closest upstream baseline for The Last Bookshop.

Official references reviewed:

- Apps SDK quickstart: `https://developers.openai.com/apps-sdk/quickstart`
- Examples overview: `https://developers.openai.com/apps-sdk/build/examples`
- Build an MCP server: `https://developers.openai.com/apps-sdk/build/mcp-server`
- Build a ChatGPT UI: `https://developers.openai.com/apps-sdk/build/chatgpt-ui`

## Why this baseline

The Last Bookshop is a submission-ready interactive React widget with server-owned game state. The Pizzaz examples are a closer fit than the minimal vanilla quickstart because they demonstrate richer UI composition, Apps SDK widget resource registration, and tool-driven state updates.

The quickstart still informs the server shape: TypeScript MCP server, Zod schemas, registered tools, registered UI resources, `text/html;profile=mcp-app`, and a public `/mcp` endpoint.

## How to apply it

- Keep the MCP server and widget decoupled.
- Return public scene state in `structuredContent`.
- Return resume tokens and widget-only layout data in `_meta`.
- Use versioned widget resource URIs.
- Use exact production CSP and widget domain settings.
- Use ChatGPT as narrator and Avery Quill, not as scoring authority or data store.

