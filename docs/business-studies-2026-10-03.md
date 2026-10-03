# Industry Next × UES business study desk

Draft route: `/communications-lab/business-studies/`. Base: `9524675de5050d9a1bab415b10bd4ab3a414f7e4` in the isolated HOME checkout `~/in-business-studies`, branch `codex/ues-business-studies-20261003`.

This instrument turns hypothetical inputs into an inspectable worksheet. Five distinct lenses cover a mixed café transaction, direct 12-ounce roasted bag, delivered wholesale roasted pound, two-bag subscription shipment and a generic licensed-retail transaction. Coffee channels retain yield, processing, packaging, delivery, postage, payment and replacement-acquisition definitions. All numeric inputs are invented teaching assumptions or visitor-entered scenarios; no real merchant's revenue, stock, margins or private financial data is represented.

The agreed café defaults produce $3,932 monthly remainder before exclusions, and 150 whole transactions/day break-even. Other coffee channels show illustrative unit contribution, while volume/fixed costs start unknown. An explicitly labeled button can load an invented operating scale. The licensed-retail lens starts with all numerical inputs unknown; it imports no coffee costs and models no license eligibility, tax mechanics or payment access.

The sensitivity rows and combined scenario scale price, volume, listed variable cost per unit, and fixed budget. Price-only stress holds the listed cost bundle constant. Fee contracts, product mix and capacity tiers require separate analysis. Zero/negative contribution has no finite positive-volume break-even, except zero contribution with a zero fixed budget, when every volume breaks even (threshold zero). Numbers are rounded for display; Markdown/JSON exports retain precision, assumptions, unknowns, source context and limits.

## Evidence and provenance

Six official context records were researched directly for the parent coffee study, observed October 3, 2026, and supplied in `/tmp/ues-coffee-economics.json`. The committed `source-ledger.json` preserves their reporting periods, geographies, classification, adjacent links and caveats: BLS national coffee and LA food-away CPI, California DIR general wage floor, Census El Segundo estimates, USDA coffee forecast, and ICO composite green-coffee indicator. Official figures do not become business-model defaults. The source subset is bounded; it is not a local census. USDA numbers remain forecasts. The generic wage floor must not be applied to every workplace.

Unit examples are adapted from the supplied research's invented models; added operating-scale examples are explicitly invented here. The subscription replacement allocation assumes a constant active base and is not observed churn or lifetime value. Café wording uses a mixed transaction rather than a beverage-only order.

The geometric study-machine SVG and layout are original code-native work. No third-party image, Nouns character, merchant logo or endorsement is used. Styling follows the existing Communications Lab's paper, cobalt, orange and ink palette. No remote requests, account, wallet, contact intake, storage, analytics or tracking are added. User notes are in memory until reload; the browser creates downloads.

## Destination and release boundaries

PointCast `/ues/business`, `/ues/coffee` and the separate dispensary atlas remain drafts, so all case references are plain pending text. The existing Communications Lab link is relative, preserving the GitHub static mirror. Existing course/brief routes, homepage, shared navigation, sitemap, build script, Functions and configuration are unchanged. The build already skips ad injection under `communications-lab/`.

Keep this PR draft until human review and the parent's serialized release lane. Do not merge, push main or deploy. PointCast publication does not publish IndustryNext; its Cloudflare Pages release requires separate verification. Remove the draft badge/noindex only in a separately approved release change, and activate PointCast case links only after checking their published destinations.

## Validation

Run `node --test tests/business-studies.test.mjs` and `npm run build`. Use an independent local server rooted at `public/`, then open `/communications-lab/business-studies/`. Check the five model lenses, unknown scale, opt-in scale, negative/zero-contribution cases, invalid inputs, combined sensitivity, worksheet text and actual downloads. Inspect wide and 390px views, keyboard-only radio/input/button/details behavior, visible focus, no horizontal overflow, and the readable no-JavaScript fallback. Final evidence is reported with the exact reviewed head rather than claimed by this source note.
