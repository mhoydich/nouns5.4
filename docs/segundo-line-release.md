# Segundo Line — Field Note 004 review draft

Status: image-complete draft for Michael's review. Do not merge or publish to production.

Repository: `mhoydich/nouns5.4`; isolated branch `codex/segundo-line-field-note-20261018`. Latest published main `513e38a` (homepage PR #8 and Hoydich Play PR #9) was merged cleanly into this branch; its homepage and unrelated work are preserved unchanged.

## Scope

- New Field Note 004 at `/editorial/el-segundo-motors/`, using the existing numbered Field Note shell, a page-scoped stylesheet, Services intake CTA, and article metadata.
- JSON twin at `/el-segundo-motors.json` and both sitemap entries.
- Four supplied original illustrations, WebP viewing copies, original JPEG full-size links, descriptive alt text, intrinsic dimensions, captions and hero social metadata.
- Homepage, mirror homepage, existing articles, shared styles, dependencies and application code unchanged relative to published main.
- Michael's reported model guild and approximately $67 Claude list-price estimate are attributed to his account. Transport capabilities, summer 2027, $145k–$260k, business customers and pilot gates are proposals, not results or commitments.
- The supplied public microsite was inspected as source content. It supplies the route detail, 20% contingency, and demand gates: at least 12 boardings/vehicle-hour, peak loads above 85% on 6 of 10 Saturdays, and 30% reporting they would otherwise have driven.

## Original images: verified

Michael directly attached the four originals on October 18 at 20:10 UTC and explicitly authorized adding them to both previews while retaining the publication hold. They were materialized on this consuming Mac with the current Library resolved-reference transfer helper and visually inspected. This resolves the earlier Library candidate/download blocker; the earlier metadata candidates are superseded by these supplied originals.

| Role | Original | Dimensions | Resolved Library ID |
| --- | --- | --- | --- |
| Six-pod beach-road hero | `line-hero.jpg` | 1456 × 818 | `libfile_ee714426165081918cfe3b58f5084937` |
| Ten-car types plate | `line-cars.jpg` | 1409 × 770 | `libfile_fd0fb7c610148191a23027c6ce7e2731` |
| The Tide poster | `line-tide.jpg` | 942 × 1209 | `libfile_83f55c504b8481919a8b42774ac3263f` |
| Metro coupling scene | `line-station.jpg` | 1455 × 818 | `libfile_f2ac164fe0ec8191b93277343db2657a` |

All assets are in `public/editorial/el-segundo-motors/images/`. `image-provenance.json` records original and WebP SHA-256 hashes, dimensions, byte sizes, source IDs and optimization. The original JPEGs are byte-for-byte copies; the WebPs retain the full original frame and dimensions at quality 90. Nothing was cropped, redrawn, relabeled or replaced. The plate and poster have descriptive prose and full-size links so their text remains available on small displays.

## Validation and release boundary

- Locked dependencies are unchanged. npm reports 18 existing dependency advisories (6 low, 5 moderate, 7 high).
- The image-complete source passes the build, Agent Futures editorial verifier, Services verifier, homepage verifier, and diff whitespace check. All eight original/WebP hashes, byte sizes and dimensions match the provenance manifest; local references, full-size links, alt text and JSON agree. Independent review and desktop/mobile/keyboard results for the exact published preview commit are recorded in draft PR #7.
- `verify:open-ad-network` has a pre-existing failure on Communications Lab: the verifier requires an ad mount, while the build deliberately excludes that educational section. The verifier and lab are unchanged relative to main.
- Light-section links use dark focus outlines; image-caption links retain contrasting light outlines on their dark backgrounds.

Only a non-production branch preview is authorized. Previously approved homepage publication does not authorize release of this Field Note. Reconcile fresh main and coordinate the release before any future approved publication. Do not merge or deploy production without Michael's review.
