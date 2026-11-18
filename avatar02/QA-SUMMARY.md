# Visual QA summary and release boundary

This branch is **draft / review candidate**, not an app release. No main merge or deployment.

## Inspection coverage
All 39 selectable items were individually viewed on the baseline character, across seven actual four-frame actions and four directions: **273 contact sheets / 4,368 posed composites**. Item sheets were opened directly or combined into labeled item mosaics; suspected issues were opened at full resolution. Detailed scope and reinspection evidence are in the four category reports. Idle reuses a single walk frame and adds no unique pose.

This is not exhaustive outfit-permutation testing. The six preview outfits are samples. Static pose inspection is not equivalent to viewing every animated loop in the actual app. No actual browser/game runtime test was completed; DOM/canvas test doubles passed.

## Corrections implemented
- Skin recolor no longer spills onto the ivory shirt.
- Original-eye erasure constrained to face interior; ear/jaw outline preserved.
- Side glasses flipped to put the lens forward rather than behind the ear; rear glasses hidden to avoid eye-like stubs over rear hair.
- Removed accessory-only head rotation that exposed bald crescents.
- Rear long hair is composited above the back of the body; hands restoration no longer punches torso-shaped holes through it.
- Shortened rear long hair; raised pigtail fringe.
- Headphone side profiles narrowed/aligned to ear rather than spanning the face.
- Footwear split and fitted to detected individual baseline feet, instead of a stationary pair hiding the walk gait.
- Non-skirt bottoms conform to animated leg silhouette. Long-trouser/overall knee skin is covered with garment color using baseline-specific tested knee regions.
- Handheld items track visible hands; book cover colors normalized. Book hidden during drink rather than pretending to drink a book.
- Baseball cap cell-edge margin corrected.

## Still not production-ready
1. Raised-arm long-sleeve tops (shirt/cardigan/hoodie) retain stationary sleeve silhouettes. Need pose-specific drawing/rigging.
2. Seated skirt remains a static skirt fit and needs seated cloth shape.
3. Bottom color-transfer fallback loses pocket/seam details; it is a motion-safe fallback, not final trouser artwork. Knee-region logic is specific to this base atlas, not general-purpose rigging.
4. Eye shape selections override base pose expressions; no item-specific expressive blink/smile tracks.
5. Mini bag reads more like a waist bag in front/back views. Hats hide hair instead of supporting visible fringes.
6. Hand props follow hands but are not full prop-specific acting; no reading animation. Cups become heavily hand-occluded in drink/front frames 1–2 and celebrate/profile frame 1; exact grasp/rim visibility needs polish.
7. Pixel shading/detail consistency and complex outfit occlusion still merit production art polish.

## Automated validation
`python avatar02/tools/validate_assets.py`: transparent RGBA atlas dimensions, per-cell margins, item/motion coverage.
`node avatar02/test-viewer.mjs`: 1,248 item/direction/motion layer plans, 2,632 file references, timing/order/palette checks and DOM/canvas test-double controls.

These checks establish structural integrity, not artistic approval.
