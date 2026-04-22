# Claude Handoff

Hello Claude, thanks for helping manage this repo.

Latest sprint context:

- Drum Nouns Jam now has a Durable Object room coordinator Worker in `workers/jam-room-coordinator/`.
- Pages Functions use `JAM_ROOM_COORDINATOR` when that binding exists and fall back to the in-memory room store locally.
- The coordinator persists room snapshots, open-stage discovery, live totals, and room leaderboard state.
- Deploy order should be coordinator first, then Pages, then bind Pages to `JAM_ROOM_COORDINATOR`.

Useful checks:

```sh
npm run build
npm run verify:drum-jam
npx wrangler deploy --dry-run --config workers/jam-room-coordinator/wrangler.jsonc
```
