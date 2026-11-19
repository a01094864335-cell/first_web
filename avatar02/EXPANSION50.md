# 51 → 101: fifty additional selectable parts

Exactly fifty new independently selectable parts, not fifty color presets. Existing 51 item definitions and 1,015 legacy PNG atlas bytes are guarded by `tools/test_expansion50.py`; the only permitted legacy metadata extension is additional hair/hat variants.

New inventory: 10 hair, 10 tops, 8 bottoms, 5 shoes, 6 hats, 4 glasses, 4 body accessories, 3 hand accessories. Each item has four directional source designs and seven fitted motion atlases. Idle reuses walk frame 1. Total catalogue: 101 items, 20 hairstyles × 10 hats = 200 fitted combinations. Open-top visor preserves hair rather than cutting a crown opening.

## Real deliverables
- `manifest.json` and transparent `assets/` atlases are the actual runtime inputs.
- `source/expansion50_{head,clothes,gear}/` contains 50 distinct generated sources and provenance/specifications.
- `previews/expansion50/catalogue-01.png` through `catalogue-15.png`: all 50 new items, actual worn front/back/left/right idle views.
- `previews/expansion50/four-outfits.gif`: four actual combinations, four directions, walk/greet/sit/celebrate; 16 frames. Not a browser capture.
- `previews/expansion50-motion/`: 350 actual composite sheets, 5,600 item/action/direction/frame poses. File generation alone is not visual-review evidence; see category QA reports.

## Verification and limits
The production categories independently inspected all their 112 poses per new item, and then repeated inspection of the final builder composites. An additional independent reviewer inspected all 200 idle views. Head QA also inspected 240 new-hair/new-hat directional idle combinations (10 × 6 × 4), not all 200 pairs in every motion. The coordinator inspected four dense outfit snapshots across all four directions and four motions (64 poses), plus selected catalogue pages. All outfit permutations are NOT exhaustively checked.

Regression checks cover exact 101-item count, exactly 50 additions, legacy byte preservation, 3,605 referenced RGBA atlases, complete directional/action maps, all 200 hair/hat combinations, transparent canvas margins, 3,232 item/motion/direction layer plans and 6,568 file references. DOM/Canvas test doubles are not browser rendering proof.

Real Chromium launch was attempted locally, then retried through the supported execution-approval path. Both exited before page load with `socket() failed: Operation not permitted`. No real browser Canvas or screen-reader verification is claimed; no public deployment was created to bypass this limitation.

Pixel-art constraints remain: clothes fit the original compact body; coats are short fitted variants and trousers preserve the articulated leg silhouette while adding distinct generated patterns, patching, cuffs and seams. Small details are less legible at native 80-pixel scale. Long hair and dense accessories can naturally obscure limbs. Body accessories share one slot. Non-drink hand props are stowed during drinking and all hand props are hidden from the rear. These are selectable production candidates, not a claim of final game quality approval.

## Corrections made in this expansion
Front low ponytail was trimmed to avoid a beard-like shape; straw underside was removed; rain-hat face opening and visor eye clearance were adjusted. Backpack orientation/side reversal was fixed. Hand-prop height is reduced while preserving the grip when it would extend below the canvas. Hexagonal glasses' pale opaque lens fill was made translucent so eyes remain visible. Full original-asset preservation is rechecked after rebuilding.

No main merge or public deployment is authorized by this package.
