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

## Endpoints

- `/api/catalog` returns trait counts and official filenames
- `/api/random` returns a random rendered Noun
- `/api/render` renders a specific seed using query params:
  - `background`
  - `body`
  - `accessory`
  - `head`
  - `glasses`
