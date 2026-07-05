# Privacy

The Last Bookshop stores anonymous game state only.

Stored data:

- shop name
- shop style
- encounter progress
- selected book and recommendation reason
- generated world identifiers
- hashed resume token
- timestamps and expiry

The app does not implement authentication, payments, advertising, leaderboards, or external book APIs.

Resume tokens are the only recovery mechanism in the vertical slice. If a token is lost, the world cannot be recovered.

Default retention is 90 days through `WORLD_RETENTION_DAYS`. A future deletion tool can remove a world by verified resume token.

