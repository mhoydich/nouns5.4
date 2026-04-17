# Nouns Web Prototype

Local browser prototype that renders authentic Nouns using the official asset data and SVG builder.

## Sources used

- `@nouns/assets` for original CC0 image data
- `@nouns/sdk` for `buildSVG`
- Official Nouns monorepo: `https://github.com/nounsDAO/nouns-monorepo`
- Mainnet `NounsDescriptor` address from the SDK package: `0x33A9c445fb4FB21f2c030A6b2d3e2F12D017BFAC`

## Run

```sh
npm install
npm start
```

Then open `http://localhost:4173`.

## Cloudflare Pages

This app is already static, so Cloudflare Pages can deploy `public/` directly from GitHub without a build step.

Recommended setup:

1. Create a new Cloudflare Pages project from the GitHub repo `mhoydich/nouns5.4`
2. Use these build settings:

- Framework preset: `None`
- Build command: `exit 0`
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
