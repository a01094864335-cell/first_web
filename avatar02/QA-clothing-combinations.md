# Skin / eyes / non-tee clothing combination QA

## Reviewed scope

Visually opened 11 actual-composite contact sheets: six non-tee tops (legacy vest, blue shirt, rust cardigan, lavender hoodie, moss vest, denim overall top), each with navy trousers + deep skin + dot eyes; five bottoms (legacy shorts, charcoal shorts, navy trousers, coral skirt, denim overall bottom), each with blue shirt + deep skin + dot eyes. Every sheet contains all 7 source actions, 4 directions and 4 frames: **1,232 composed poses**. This is selected cross-slot coverage, not every possible top/bottom/skin/eye/accessory combination.

Full review-only sheets live outside the repository to avoid duplicating the atlas in Git. Reproduce with `python tools/render_clothes_combo_qa.py --output /path/to/review-folder` from any working directory.

## Findings and fixes

1. **Deep-skin pale hand highlights**: greet/right/frame 2 retained three pale base-skin pixels. Cause was the builder's strict skin-valid filter, not the renderer's hands restoration. The source recolored overlay already contained the correct pixels. The builder owner added a narrow warm-highlight predicate `(R-G>15 && G-B>25)` alongside the original skin mask; this avoids broadly recoloring the cream shirt.
2. **Vest/overall lowered-arm silhouettes**: legacy teal vest, moss vest and denim overall top bypassed the pose-aware top fitter, carrying source-side forms into raised-arm poses. Connected all three to `fit_top`. Added a sleeveless-only branch constrained to the actual posed shirt/torso envelope, excluding skin. It does not recolor arms as sleeves. Existing long-sleeve branch is unchanged.
3. **Bottoms**: no newly blocking body-escape, neck covering or incorrect feet hiding observed in these selected 560 bottom-combination poses. Shorts and trousers remain weakly differentiated in silhouette because they inherit baseline leg motion. This is a visual limitation, not hand-drawn independent tailoring.

## Recheck status

After the integrated rebuild, directly reopened all six top combination sheets (672 poses): three repaired sleeveless pieces plus blue shirt/cardigan/hoodie regressions. The vest/overall torso now follows the body envelope rather than retaining the original standing outline below the posed torso. Raised arms remain visible; no new body escape or neck cover was observed. Cream areas around the shoulders remain where they represent the underlying shirt, not skin. Side-view torso identity is compressed at this small scale; it is not a newly hand-redrawn directional garment.

Confirmed the three greet/right/frame-2 deep-skin hand-highlight pixels now have opaque recolored values `(149,90,58)`, `(151,91,58)`, `(149,90,58)`, and visually inspected the enlarged before/after crop. No pale hand-highlight patch remains in that reported location. Shirt/hoodie/cardigan sampled motion sheets did not show a new skin-mask contamination regression.

Representative inspected evidence: `previews/clothing-combo-before-after.png` and `previews/skin-highlight-before-after.png`. Only these two compact sheets are retained in the repo. The 11 full before/after sheets remain outside Git. The final five bottom sheets were regenerated but not individually reopened in this final pass; their earlier 560-pose visual inspection remains the claimed scope.

`test_clothes_fit.py` passes 336 structural checks: nonempty sleeveless torso, no overlap of detected posed skin and no body-alpha escape (representative legacy vest source). This test is not exhaustive art validation.

Skin/eyes were present in every reviewed combo, but this pass uses deep skin + dot eyes only; the earlier explicit 3-skin / 3-eye / 3-palette sampled matrix is documented in QA-eyes-skin.md. All arbitrary combinations, game-scale temporal playback and actual browser interaction are not claimed as verified here.
