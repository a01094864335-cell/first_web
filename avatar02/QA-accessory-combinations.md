# Accessory combination QA, v0.5 follow-up

## Actual inspection scope
Used actual `render_proofs.py` render function and catalogue manifests/atlases, not concept composites. Opened the full seven-action contact page for every item below in both outfit strata; each page contains 7 actions × 4 directions × 4 frames = 112 poses.

Items: shoes-sneakers, shoes-loafers, shoes-boots; body-crossbody, body-mini-bag, body-headphones; hand-mug, hand-takeout-cup, hand-book.

Outfit A: skin-deep + hair-short + top-cardigan-rust + bottom-trousers-navy.
Outfit B: skin-warm + hair-long-straight + top-hoodie-lavender + bottom-skirt-coral.

Total unique inspected combinations/poses: 9 × 2 × 112 = **2,016**. Actions: walk/greet/drink/examine/sit/celebrate/dress, F/R/B/L frames 0–3. These are representative long/short hair and trouser/skirt combinations, **not every Cartesian combination** of the full catalogue. Idle reuses walk frame 1.

## Findings and fixes

1. **Headphones hidden by hair in profile**: body layer was drawn before hair, causing both profile ear pads to disappear with hair-short. Reported to hair/render owner; latest actual render now draws headphones over hair. Reopened all 112 headphone poses in outfit A and all 112 in outfit B: band and pads remain visible; no missing profile equipment. Evidence below.
2. **Crossbody pouch below soles during lean/crouch**: examine front/right/left frame 2 extended below the character's ground baseline. Added `tools/fit_crossbody.py`; integrated into `add_existing` only for body-crossbody. The inherited 80px overlay retains shoulder strap's top position; only excessive hanging height is compressed to end above the base sole. Regenerated the seven crossbody atlases only, not whole catalogue. Reopened all seven actions in both outfits after modification: pouch no longer extends below ground and strap remains attached. Evidence below.
3. **Deep-skin hands retain light pixels with cardigan**: observed notably greet right frame 2; referred to skin/clothes owner. This report does not claim the skin issue resolved; final owner's rebuild/QA covers it.

## Other actual checks

- All three footwear types stay on visible baseline feet in both outfits, including split walk stance and seated profiles. No footwear cell clipping or detached extra shoe observed. Boots may be mostly covered by trousers/skirt, but bottom silhouette remains visible.
- Mini bag stays on one anatomical side, stable frontal drink height, with long hair legitimately hiding portions of strap/back. Pouch remains visible at hip, no return to central belt-bag layout.
- Hand items preserve hand-adjacent positions with both sleeves, front drink visibility, rear occlusion, teal book identity and book stow during drinking. Profile sip tilt remains subtle. No newly detached prop seen.
- Individual finger-handle contact is still stylized, not anatomical animation. This is not a claim that all items/poses were hand-redrawn.

## Committed evidence

`previews/qa-evidence/headphones-hair-before.png`
`previews/qa-evidence/headphones-hair-after.png`
`previews/qa-evidence/crossbody-ground-before.png`
`previews/qa-evidence/crossbody-ground-after.png`

Each evidence page uses outfit A and contains all seven actions, four direction groups × frames 0–3 per row. Full working sheets are intentionally not committed. No commit/push was performed by this reviewer. Whole catalogue rebuild and final browser validation remain with coordinator.
