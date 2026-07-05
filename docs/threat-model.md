# Threat Model

## Token Guessing

Resume tokens use 32 random bytes encoded as base64url. Only SHA-256 hashes are stored. Invalid token shape is rejected before lookup.

## Token Leakage

Raw tokens are returned only in tool `_meta` and stored in widget state/local storage. Logs exclude raw tokens and hashes.

## Prompt Injection

The backend does not call an LLM and does not trust ChatGPT for state, scoring, hidden preferences, or persistence. Avery's recommendation is just another validated tool input.

## Hidden-State Leakage

Public scene output omits Edith's hidden likes, dislikes, sensitive topics, and scoring weights. The scoring module imports full seed content server-side only.

## Oversized Input

Zod limits shop names, questions, reasons, IDs, and request JSON body size.

## Replay Attacks

Mutating tools require `expectedWorldVersion`. Stale mutations fail. Resolution is idempotent and rewards apply once.

## Concurrency

The world aggregate has a numeric version. Mutations compare expected version before saving.

## Malicious IDs

Book IDs must match available book IDs in the current encounter.

## Path Traversal

The server serves a fixed built widget resource and does not accept arbitrary file paths.

## Secret Logging

Structured logs include tool name, duration, outcome, world version when available, encounter ID when available, and error category. Tokens, token hashes, credentials, and full user messages are excluded.

## Cross-App Impact

Last Bookshop uses `/opt/last-bookshop`, port `3100`, dedicated Docker names, and a separate SQLite volume. It must not mount Loans MCP directories or touch the `greenbridge-loans` service.

