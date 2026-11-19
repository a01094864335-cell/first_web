# Tee fit correction

Items: top-plain (inherited mint), top-tee-plain, top-tee-striped.

Cause: source tees were resized into fixed 26×20 /16×20 torso rectangles, leaving garment necklines below the actual neck, extraneous relaxed sleeves and overly low hems. Inherited mint used a different source-mask pathway.

Implemented `tools/fit_tees.py::fit_tee` for all three. Original baseline short-sleeve garment pixels define neck, shoulder, sleeve and waist boundaries independently in every pose. Only ivory fabric pixels are recolored; original dark outlines and peach hands stay untouched. Stripe phase is anchored to visible garment top. Builder routes both inherited mint and generated tees into this same fitting function. Long-sleeve fit is unchanged.

Initial QA found light grey seated shoes accidentally included in a permissive cream-color test; corrected by lower chroma bounds (R−G>5 and G−B>7). Revised sit side frame1 tee alpha ends at y64, outside grey shoe region. Latest standalone artifacts include this fix; full parent rebuild must use current module.

## Inspected actual images

- 3 items × 7 actions × 4 directions × 4 frames =336 single-item poses, all viewed in three contact montages.
- Same 336 poses with skin-deep, hair-short, eyes-dot, trousers-navy and sneakers, using actual render_proofs render function with revised tee atlases injected in its cache. No missing tee from final hand restoration observed.
- Explicit idle: each item's walk frame1 × all four directions, with same outfit, 12 additional displayed poses. Not merely inferred from walk mapping.
- Greet/celebrate all16 poses each per item checked specifically for raised shoulders/sleeves. Original sleeve shapes follow raised arm geometry instead of keeping relaxed-source sleeves. Cream pixels above head-bottom were enumerated: sparse face/hand highlight candidates, not an omitted continuous tee sleeve region; retained conservative spatial exclusion avoids face recoloring.
- Before/after comparison: walk f1, greet f2, sit f1, four directions, three items. Shows corrected neck attachment and reduced torso box/hem.

## Evidence

External task folder `avatar-tee-fix/before` preserves original contact sheets and 21 original atlases. `avatar-tee-fix/after` contains revised 21 atlases, single-item/all-action montages, matching outfit montages and idle-combos.png. `avatar-tee-fix/tee-fit-before-after.png` regenerated against latest corrected atlases (not first build).

No exhaustive cross-product outfit claim. Recoloring conforms to existing baseline tee anatomy, not a new billowing silhouette. Stripes are simplified pixel bands, no subpixel cloth simulation. Structural validator passed on first integrated build; final combined parent build should repeat it after all category changes.
