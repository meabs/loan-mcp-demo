# The Last Bookshop Architecture

The Last Bookshop is a ChatGPT App with a decoupled MCP server and React widget.

## Components

- `apps/server`: Express MCP server, health endpoint, game engine, SQLite repository, token security, observability, and Apps SDK resource/tool registration.
- `apps/widget`: Vite React widget rendered as `text/html;profile=mcp-app`.
- `packages/contracts`: shared Zod schemas and TypeScript types.
- `packages/game-content`: authored Edith Vale, book, question-answer, and asset manifest content.
- `packages/test-fixtures`: small shared test fixture package.

## State Ownership

The server owns all truth:

- anonymous world state
- resume token hashes
- hidden customer preferences
- deterministic scoring
- rewards
- concurrency checks
- persistence

ChatGPT narrates and acts as Avery Quill, but must submit Avery's choice through `submit_rival_recommendation`.

The widget renders public state and dispatches explicit tool calls.

## Persistence

SQLite stores a `worlds` aggregate table with:

- world id
- hashed resume token
- serialized public world aggregate
- last authored answer
- created, updated, and expiry timestamps

The raw resume token is returned only in tool `_meta`.

