# Full 51-item static-frame audit — 2026-11-18

## What was inspected exhaustively
All **51 selectable parts**, each worn on the actual base character, across seven source motions (walk, greet, drink, examine, sit, celebrate, dress), four directions and four source frames: **357 contact sheets / 5,712 item poses**. All cells were visually inspected through labeled sheets/mosaics; suspected small details were enlarged. Separately rendered and inspected **204 idle views**; these repeat walk frame 1 and are not counted as new poses.

| Category | Items | Source poses | Duplicate idle views | Detailed report |
|---|---:|---:|---:|---|
| Tops | 12 | 1,344 | 48 | QA-full-tops.md |
| Hair, hats, glasses | 16 | 1,792 | 64 | QA-full-head.md |
| Shoes, body and hand equipment | 11 | 1,232 | 44 | QA-full-accessories.md |
| Bottoms, eye shapes and skin | 12 | 1,344 | 48 | QA-full-bottoms-face.md |
| **Total** | **51** | **5,712** | **204** | QA-full-audit-matrix.json |

The matrix lists every reviewed item, motions, directions, frame indices and atlas hashes. The result applies to that frozen asset snapshot, not automatically to future file changes.

## Additional combination samples
- 12 tops in a selected dressed outfit: 192 critical-pose views.
- 11 accessories in a selected deep-skin/long-hair outfit: 1,232 posed composites.
- All 40 hair/hat pairs at two selected frames and four directions: 320 views, **not** every frame of every pair.
- All 27 eye-shape/skin/lens palettes at three selected poses and four directions: 324 views.
- Six dense full outfits across all seven source motions/directions/frames: 672 composites; selections and representative evidence are in previews/full-audit/.
These sample counts overlap the exhaustive item pass and each other. **All possible wardrobe permutations were not inspected.**

## Findings, actual correction and recheck
No newly confirmed blocking asset alignment or layering defect was found in the frozen 51-item set. No character atlas was changed in this audit. Existing corrections to tees, sleeves, shoes, cups, bags, eye expressions and head-layer order remained intact in the reviewed scope.

A real **QA-output defect** was found: render_hat_proofs.py retained a fixed 2,100px canvas from the six-hair catalogue, clipping the last four hairstyles after expansion. It now computes height from the current hair count. All 28 hat/motion sheets were regenerated at 1,280 × 3,500. The last row was visually checked and test_proof_layout.py verifies every sheet includes all 10 hair rows. This fixes inspection evidence, not game artwork.

## Retained limitations
Long/voluminous rear hair hides some torso/arm gestures; high-bun shape is compressed by fixed cell headroom. Dense bag-plus-hand-prop outfits can obscure the torso. Deep skin with charcoal/green eyes has lower contrast, and fine expression curves/fingertip grip/fabric folds remain compact-pixel art polish opportunities. Book/camera stow during drinking and handheld rear occlusion are intentional.

This was **static rendered-frame inspection**. Full browser Canvas pixel parity, actual-game interaction and uninterrupted animation playback were not exhaustively tested. The existing local-browser connection limitation remains; no public deployment was created. Passing geometry/reference tests does not mean every outfit is aesthetically approved.

## Checks
1,015 referenced atlases, 51 item mappings and 40 hair/hat variants; 1,632 viewer plans and 3,392 file references; legacy 39 ID/slot preservation; eye 1,008 output cases/12 expression keys; 336 sleeveless fit cases; Python/JS eyewear clipping parity on 2,016 actual cases; 28 dynamic-height proof sheets. All passed against the audited snapshot and QA generator fix.
