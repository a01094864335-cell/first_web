# Accessory visual QA

Reviewed 2026-11-18. Method: opened each individual 640×700 contact sheet at readable size and inspected all four direction rows (Front, Right, Back, Left), each frames 0–3. This is static frame QA, not an assertion of full in-browser animation/combinatorial acceptance.

## Complete inspected matrix
Every cell below means all 16 poses were visually inspected, including correctly occluded rear hand props. Total: 42 sheets / 672 poses.

| Item | walk | greet | drink | examine | sit | celebrate | dress |
|---|---|---|---|---|---|---|---|
| body-headphones | checked | checked | checked | checked | checked | checked | checked |
| body-mini-bag | checked | checked | checked | checked | checked | checked | checked |
| body-crossbody | checked | checked | checked | checked | checked | checked | checked |
| hand-mug | checked | checked | checked | checked | checked | checked | checked |
| hand-takeout-cup | checked | checked | checked | checked | checked | checked | checked |
| hand-book | checked | checked | checked | checked | checked | checked | checked |

## Findings on original preview pass

- **P1, hand-mug / greet / Right, Left / frames 1–2:** cup remains at waist while visible hand rises. Clear detached prop. Same root cause in all three hand items.
- **P1, all hand items / celebrate / Front, Right, Left / frames 1,3:** raised hands leave prop at torso level. Frame 1 especially obvious; not an intended airborne cup effect.
- **P1, hand-mug / examine / Right / frames 0–3:** empty space between torso/hand and mug; frame 2 lean increases separation. Takeout cup and book frame 2 also lose firm contact.
- **P1, all hand items / dress / Right, Left / frame 1:** hands at chest, prop lower beside waist. Additional less obvious drift at frames 2–3.
- **P2, hand-book / every action / Left / frames 0–3:** cover brown versus teal in Front. Different source direction colors break single-item identity; palette needs unification.
- **P2, hand-book / drink / Front, Right, Left / frames 1–2:** book raised as though drinking. Item-specific action substitution is preferable (read/look at book), or hide/book stow during drink. Position correction alone is not semantic action correction.
- **P2 design, body-mini-bag / every action / Front and Back:** pouch spans central pelvis, appearing as a belt bag, not the intended small side shoulder bag. It does not clip; visual distinction from crossbody could be clearer. In sit frames 1–2 pouch overlaps lap as expected but covers much of shorts.
- **P3, body-crossbody / examine / profiles / frame 2:** lower pouch is narrow and close to feet. Understandable at small scale but can benefit from a 1–2px higher bag body while retaining shoulder strap.

## Successful checks

- body-headphones: all seven actions keep band and ear pads on the head, including profile examine frame 2 and celebrate frame 1. No floating band, face duplication, cell clipping, or missing directions observed.
- body-crossbody: diagonal strap remains attached and item identity consistent across all poses. Hands generally remain in front of strap.
- body-mini-bag: no cell cropping or detached bag components; stable lavender color.
- Hand props are absent in rear direction intentionally because held in front of torso, not missing asset files.
- Original mug/drink already showed reasonable hand contact. Original takeout/drink has plausible raised cup and hand contact.

## Implemented corrective module

Added `tools/fit_hand_props.py`, callable `fit_hand_prop(z0, basecell, handsmask, directionIndex, action, frame, id)` returning an 80×80 RGBA item overlay. Uses actual skin pixels intersected with hands mask rather than head/torso-relative fixed offsets. Selects near hand per direction, preserves rear occlusion and moves cup rim upward for drink frames 1–2. Caller must redraw hands last. Parent owns builder integration.

Local proof `/tmp/hand-fit-qa.png` inspected after fitting: all three hand items × greet/celebrate × 16 poses (96 updated poses). Clear waist-versus-raised-hand separation is removed; cup/book follows hand. Remaining: exact finger grasp and mug handle grip are approximate; book color and book-drink semantic issue are not fixed by this module. Full regenerated 42-sheet pass should be rerun after parent integration before calling the package final.

### Follow-up correction
Book warm/brown cover pixels are now normalized to teal by `fit_hand_props.py`, preserving black outlines and cream page edges. Reopened the local 96-pose proof after this change: left book now reads as the same teal item. Historical P2 color finding above is addressed in the module; verify again in regenerated integrated previews. Parent confirmed fitting module is connected for all hand items and all actions, including mug.

## Final integrated hand-item reinspection
Reopened all 21 regenerated hand-item contact sheets individually after integration: 3 items × all 7 actions × all 16 poses = 336 final poses. No code/images changed during this frozen review.

- All three hand items now track actual hands rather than remaining fixed at the waist. Original P1 detached-prop cases are substantially corrected; no cell clipping seen.
- Book teal palette consistent across front/left; right shows cream page edges with teal cover. Original color mismatch resolved.
- Book is intentionally stowed for all drink poses, including front. Original book-as-drinking-vessel issue resolved. The base drink motion alone remains empty-handed in this isolated preview; runtime needs to supply a cup if a visible drink is desired.
- Rear held-item invisibility remains intentional and consistent.

### Remaining non-blocking visual polish, not a production-perfect claim
- **P2 hand-mug and hand-takeout-cup / drink / Front / frames 1–2:** hands cover most of the cup; tiny visible sliver makes the item hard to identify. Profiles show it more clearly, but exact lip/rim contact is approximate.
- **P2 hand-mug and hand-takeout-cup / celebrate / Right and Left / frame 1:** raised arm/body masks heavily obscure small cup, sometimes nearly entirely. No detached object, but item visibility drops compared with neighboring frames.
- **P3 all hand props / walk / Right / frame 3:** chosen visible hand sits higher than frame 1, producing a stronger upward prop movement. Follows underlying hand but can look like extra bounce. Frame-by-frame animation tuning would improve this.
- Finger grasp, cup tilt, and item-specific acting are still fitted overlays, not individually redrawn final animation.

Result: acceptable as a reviewable modular-asset PR with disclosed P2 polish; do not label it final animation-art acceptance. Original body QA findings remain as above; this pass specifically rechecked the 21 hand sheets.
