# Nouns Web Prototype

Local browser prototype that renders authentic Nouns using the official asset data and SVG builder, plus a bundled Tezos testnet minting flow and a local gallery queue for saved drafts.

## Sources used

- `@nouns/assets` for original CC0 image data
- `@nouns/sdk` for `buildSVG`
- Tezos docs tutorial for wallet + NFT mint flow
- Taquito wallet toolkit for Tezos dApps
- Official Nouns monorepo: `https://github.com/nounsDAO/nouns-monorepo`
- Mainnet `NounsDescriptor` address from the SDK package: `0x33A9c445fb4FB21f2c030A6b2d3e2F12D017BFAC`

## Run

```sh
npm install
npm start
```

Then open `http://localhost:8788`.

`npm start` builds the browser bundle first, then runs the full Cloudflare Pages app locally, including the dynamic routes used for mint metadata and SVG rendering.

If you only want the older static server without Pages Functions:

```sh
npm run serve:static
```

If you only want to refresh the browser bundle:

```sh
npm run build
```

## Tezos Minting

The mint panel connects to Tezos wallets through a bundled Taquito/Beacon flow and mints on the Tezos `Shadownet` testnet using the official tutorial contract:

- Contract: `KT1NbqYinUijW68V3fxboo4EzQPFgRcdfaYQ`
- Explorer: `https://shadownet.tzkt.io/KT1NbqYinUijW68V3fxboo4EzQPFgRcdfaYQ`
- Tutorial source: `https://docs.tezos.com/tutorials/create-nfts/send-transactions`

The app now exposes two dynamic routes that the mint flow uses:

- `/api/noun` returns the current seed as `image/svg+xml`
- `/api/token-metadata` returns JSON metadata for the current seed and token copy

This keeps minted NFTs pointing at a stable image URL and metadata URL hosted by the same project instead of stuffing a huge SVG payload directly into the token metadata map.

## Cloudflare Pages

The deployed site still publishes `public/`, but the browser client is now generated from `src/app.js`, so Cloudflare Pages should run the build before serving the output directory.

Recommended setup:

1. Create a new Cloudflare Pages project from the GitHub repo `mhoydich/nouns5.4`
2. Use these build settings:

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `public`
- Production branch: `main`

After the first deploy, Cloudflare will give you a project subdomain such as:

`https://<your-project>.pages.dev`

Then add the custom domain `www.industrynext.xyz` in the Cloudflare Pages dashboard.

Namecheap DNS for the Cloudflare Pages setup:

- `CNAME` host `www` -> `<your-project>.pages.dev`
- `URL Redirect Record` host `@` -> `https://www.industrynext.xyz/` unmasked

Important:

- Add `www.industrynext.xyz` in the Cloudflare Pages dashboard before relying on the DNS record alone
- If you keep using an external DNS provider for `industrynext.xyz`, the `www` subdomain works without moving nameservers to Cloudflare

Official docs used for this setup:

- `https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/`
- `https://developers.cloudflare.com/pages/configuration/build-configuration/`
- `https://developers.cloudflare.com/pages/configuration/custom-domains/`

## Wrangler CLI Option

This repo now includes a Wrangler config for Cloudflare Pages:

- Project name: `industrynext-nouns`
- Build output directory: `public`
- Compatibility date: `2026-04-16`

If you prefer terminal deploys instead of the dashboard:

```sh
npm install
npx wrangler login
npm run cf:project
npm run cf:deploy
```

After deploy, the production site will be available at:

`https://industrynext-nouns.pages.dev`

Then add `www.industrynext.xyz` as a custom domain in Cloudflare Pages and point Namecheap `www` to:

`industrynext-nouns.pages.dev`

## Durable Room Coordinator

The jam room APIs work without extra services in local fallback mode, but production traffic should use the Durable Object coordinator so room activity, discovery, and leaderboards survive worker isolate churn.

Deploy the coordinator Worker first:

```sh
npm run cf:rooms:deploy
```

Pages Functions call the deployed coordinator over HTTPS by default:

`https://industrynext-jam-room-coordinator.mhoydich.workers.dev`

Set `JAM_ROOM_COORDINATOR_URL` to a different coordinator URL if the Worker moves, or set it to `disabled` to force the local in-memory fallback. Avoid a Pages service binding here for now; Cloudflare currently serializes those Worker responses as RPC proxy objects in this project and can throw 1101s.

For local Durable Object testing, run the coordinator in one terminal:

```sh
npm run cf:rooms:dev
```

Then run Pages dev with a matching binding, for example:

```sh
npx wrangler pages dev public --do JAM_ROOM_COORDINATOR=JamRoomCoordinator@industrynext-jam-room-coordinator
```

The coordinator owns:

- `/api/jam-room` room joins, pulses, reactions, and snapshots
- `/api/jam-room-stream` server-sent room snapshots
- `/api/jam-rooms` open-stage discovery and daily spotlight room ranking

## GitHub Pages Fallback

The repository still includes a GitHub Pages workflow and the deployed artifact still contains the custom-domain file:

`https://mhoydich.github.io/nouns5.4/`

`www.industrynext.xyz`

That setup remains blocked by the GitHub account billing lock on Actions. If GitHub billing is cleared later, the old DNS target for that path would be:

- `CNAME` host `www` -> `mhoydich.github.io`
- `URL Redirect Record` host `@` -> `https://www.industrynext.xyz/` unmasked

## Asset sync

The static app reads `public/data/image-data.json`, which is generated from the official `@nouns/assets` package.

To refresh that checked-in asset file:

```sh
npm run sync:assets
```
