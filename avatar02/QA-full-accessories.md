# Full assigned accessory-item pass

## Exact scope and method
Current 51-item catalogue, assigned eleven accessories. Read actual latest `previews/individual/{id}--{action}.png` outputs. Reassembled every pose from those actual sheets into readable item contact pages, opened each and inspected each direction/frame. No pose was synthesized for this individual pass.

| ID | 7 actions × 4 directions × 4 frames | Idle 4 directions |
|---|---:|---:|
| shoes-sneakers | 112 checked | 4 checked |
| shoes-loafers | 112 checked | 4 checked |
| shoes-boots | 112 checked | 4 checked |
| body-crossbody | 112 checked | 4 checked |
| body-mini-bag | 112 checked | 4 checked |
| body-headphones | 112 checked | 4 checked |
| body-tote | 112 checked | 4 checked |
| hand-mug | 112 checked | 4 checked |
| hand-takeout-cup | 112 checked | 4 checked |
| hand-book | 112 checked | 4 checked |
| hand-camera | 112 checked | 4 checked |

Actions: walk, greet, drink, examine, sit, celebrate, dress. Direction ordering F/R/B/L; frames 0–3. **1,232 individual moving poses checked**, plus **44 separately inspected idle views** (walk frame 1 reused, not unique new artwork).

## Actual wearing-combination coverage
Rendered the same 11 items, each with **skin-deep + hair-long-straight + top-cardigan-rust + bottom-trousers-navy**, through current actual `render_proofs.py` function. Opened all 11 complete seven-action contact pages: **additional 1,232 composed poses inspected**. In this pass idle is already present as the walk frame-1 poses and not separately added to the combination count.

This means every assigned item/direction/action/frame was checked alone and in one selected stress outfit. **It does not mean every possible skin/hair/hat/top/bottom/accessory Cartesian combination was exhaustively checked.** Other catalogue categories are assigned to other reviewers.

## Findings / regression checks

- Footwear: all three silhouettes remain attached to visible feet, including spread walking feet and seated side poses. No floating extra shoe, missing direction or cell truncation found. Boots shorten visually where pants overlap; this is normal occlusion, not absent boots.
- Crossbody: earlier examine frame-2 below-ground pouch issue remains fixed; strap stays at shoulder and pouch above soles. No recurrence found across seven actions.
- Mini bag: frontal drink anchor remains stable, same anatomical side front/back, no previous belt-bag placement recurrence.
- Tote: canvas body and handles stay at side shoulder/hip, seated positioning fits. Side profile is intentionally narrow. Long hair hides upper strap/back portions, leaving side pouch visible.
- Headphones: band and pads remain attached throughout head dips and celebration. Latest renderer correctly keeps profile pads over long hair; previous invisible-profile problem does not recur.
- Mug/takeout cup: hand contact maintained, front drink cup body visible, profile frame-2 sip tilt intact, no stationary-at-waist raised-hand regression.
- Book/camera: **all drink frames intentionally stowed**; **all rear-facing hand items intentionally occluded**. These empty overlays are correct behavior, not missing art. Camera stays a carried object; no photographing animation asserted.
- Book teal identity and camera front/profile orientation remain consistent.
- Idle views match corresponding walk frame 1 in all 44 cases.

**New actionable accessory defect found in this pass: none.** No code/atlas modifications were made merely to manufacture a change. Earlier fixes have been revalidated against current integrated output. Fine finger-handle contact and per-frame cloth deformation remain stylized rather than anatomically detailed; no claim of individually redrawn production animation.

## Uninspected / limits
- Full Cartesian combinations of all 51 items, every palette, every possible simultaneous accessory: not inspected by this report.
- Live game interactions, network/loading, game-engine integration: not exercised here.
- Motion timing/interpolation at every browser/device refresh rate: not assessed by static contact sheets.
- Other 40 catalogue items: outside this reviewer's assigned list.

Temporary contact pages used for this pass are outside the repo under `/tmp/full-accessory-pass` and `/tmp/full-accessory-combos`; source evidence remains the committed actual individual PNGs. Coordinator owns final rebuild/commit/PR. No commit/push performed by this reviewer.
