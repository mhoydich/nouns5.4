# Segundo Line — Field Note 004 review draft

Status: incomplete draft for Michael's review. Do not merge or publish to production.

Repository: `mhoydich/nouns5.4`; isolated branch `codex/segundo-line-field-note-20261018`, based on `ba12d0040e24da0163b22ecc860d875fd854b482` (Nouns Money merge).

## Scope

- New Field Note 004 at `/editorial/el-segundo-motors/`, using the existing numbered Field Note shell, a page-scoped stylesheet, Services intake CTA, and article metadata.
- JSON twin at `/el-segundo-motors.json` and both sitemap entries.
- Homepage, mirror homepage, existing articles, shared styles, dependencies and application code unchanged.
- Michael's reported model guild and approximately $67 Claude list-price estimate are attributed to his account. Transport capabilities, summer 2027, $145k–$260k, business customers and pilot gates are proposals, not results or commitments.
- The supplied public microsite was inspected as source content. It supplies the route detail, 20% contingency, and demand gates: at least 12 boardings/vehicle-hour, peak loads above 85% on 6 of 10 Saturdays, and 30% reporting they would otherwise have driven.

## Required originals: unresolved

The Library search identified these metadata candidates from October 17, 2026. None is yet a visually verified local original. The hero has a related variant that must be compared before final selection.

| Role | Library candidate | Library ID | Underlying file ID |
| --- | --- | --- | --- |
| Hero | Butterfly blue seaside people mover.png | `libfile_e92b505b2dd88191bdc60ae4003bb15a` | `file_000000005d948230b93135d6970ba2da` |
| Hero comparison | Sunset pod train with unbranded surfboards.png | `libfile_a3476e28e488819198e0b726f5bae673` | `file_00000000699081f882af62eab7774f87` |
| Car types | Ten modular electric road pods.png | `libfile_9c8b082a168c81919e34860413c1695d` | `file_00000000a3c881fdbf2026be28228898` |
| Tide | The Tide: Coastal Transit Through Time.png | `libfile_84ca4f372be48191ad259e572da491da` | `file_000000008a9881fd951c7df7ad0ee95d` |
| Coupling | Sunset Pods Beneath the Elevated Metro.png | `libfile_a9c546800f8c8191b491f8e88796950e` | `file_00000000277081f6a1944a244f213d58` |

The mandated current Library bundled download helper was invoked on the consuming Mac with a local destination. It failed with `Library prepare_materialize is not available`; a single retry after new capability evidence returned the same result. No bytes were materialized. This is a capability blocker, not a policy denial.

Do not substitute generated artwork, guessed storage URLs, public microsite extractions or a remote sandbox path. Complete the approved Library retrieval, inspect actual files, select the matching four, insert them with dimensions/alt text/captions, then rerun validation on the final commit. Current HTML deliberately contains no broken image references or substitute art; social metadata is text-only until the real hero is available.

## Validation and release boundary

- `npm ci --ignore-scripts` and `npm run build` pass; no dependency changes. npm reports 18 existing dependency advisories (6 low, 5 moderate, 7 high).
- `npm run verify:agent-futures` and `npm run verify:services` pass.
- `npm run verify:open-ad-network` fails on the pre-existing Communications Lab page: the verifier requires an ad mount, while the build deliberately excludes that educational section. Both files and Communications Lab are unchanged in this branch.
- `git diff --check` passes. Homepage and mirror homepage are byte-unchanged from the base.
- Independent source review requested; its focus-contrast finding is corrected with dark focus outlines on light sections.
- Browser checks cover desktop, mobile, skip link, section navigation, link focus, article JSON and Services intake target. Preview verification and any remaining findings belong in the draft PR record.

Only a non-production branch preview is authorized. The IndustryNext homepage redesign has separate homepage-only publication approval; that approval does not cover this Field Note. Reconcile fresh main and coordinate the release before any future approved publication. Do not merge or deploy production without Michael's review.
