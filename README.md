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

## GitHub Pages

The repository includes a GitHub Pages workflow that deploys the contents of `public/` using the current official Pages Actions flow.

Expected Pages URL:

`https://mhoydich.github.io/nouns5.4/`

## Asset sync

The static app reads `public/data/image-data.json`, which is generated from the official `@nouns/assets` package.

To refresh that checked-in asset file:

```sh
npm run sync:assets
```
