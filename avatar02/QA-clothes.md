# Clothing / footwear visual QA

Review scope: 17 items × 7 action contact sheets × 16 poses = 119 sheets / 1,904 pose thumbnails. Every sheet was visually reviewed in per-item seven-sheet montages; this is contact-sheet inspection, not 119 individual full-resolution inspections or runtime animation QA. Rows front/right/back/left; frames 0–3. Native top-vest walk additionally inspected. Small one-pixel flaws can remain.

Actions reviewed for every item: walk, greet, drink, examine, sit, celebrate, dress. Idle not independently reviewed (mapped pose).

| Items | Finding |
|---|---|
| top-plain, bottom-shorts | No major item-specific clipping seen; inherited basic overlays retain motion. |
| top-vest | No catastrophic detachment; static clothing silhouette needs polish. |
| top-tee-plain, top-tee-striped | Medium: sleeves stay relaxed during raised arm poses, notably greet front f1/f2 and celebrate front f1/f3. |
| top-shirt-blue, top-cardigan-rust, top-hoodie-lavender | Medium/high: long sleeves stay down while exposed arm raises at greet front/back f1/f2 and celebrate front/back f1/f3. Not pose-specific sleeve articulation. Sit side f1/f2 torso hem also remains stiff. |
| top-vest-moss, top-overall-denim | Medium: stiff torso silhouette and hand occlusion at side sit f1/f2; silhouette/straps remain identifiable. |
| bottom-shorts-charcoal | Medium: static lower hem masks some leg motion in walk front/back f0/f2. |
| bottom-trousers-navy, bottom-overall-denim | High: fixed lower garment hides alternating feet at walk front/back f0/f2. Side sit f1/f2 uses standing trouser shape over bent leg area. |
| bottom-skirt-coral | Medium: rigid hem during walk; side sit f1/f2 is standing skirt, not folded seated skirt. |
| shoes-sneakers, shoes-loafers, shoes-boots | High in initial build: fixed pair covers independent feet in walk front/back f0/f2 and side spreading stance f0/f2. Seated pair also fails to follow moved feet. Remediation below. |

## Footwear remediation

Independent module `tools/fit_shoes.py`, callable `fit_shoes(z0, basecell, directionIndex, action, frame)`, returns 80×80 RGBA overlay. Detects neutral-gray foot interiors in bottom 10 baseline pixels, separates visible foot components, fits front/rear source shoes individually and crops foreground profile from overlapping side source. Adds opaque underlay over original gray interior to avoid pale residuals.

Local standalone composite proofs produced for all three shoes, walk and sit (96 poses) and visually inspected. Each foot now follows the baseline's location and elevation rather than a shared pair baseline. This is deterministic fitting, not newly hand-drawn articulated footwear. Shoe detail is small at 80px; side source crop and boot shaft proportions need art polish. Integration into builder and regeneration of final proofs required by parent; this reviewer did not modify the builder.

Known baseline limitation: front walk f0 and f2 already resemble each other strongly, so following those feet cannot invent a missing opposite phase. No browser/runtime verification performed by this reviewer. No all-combination coverage: these sheets display each item against baseline, not every possible outfit. Long trousers may still conceal fitted shoes depending layer order.

## Status

Not a production-pass certificate. Clothing sleeve/leg articulation issues above remain open. No source imagery regenerated or builder modifications made during this review. No merge/deploy performed.

## Lower-garment fallback added after initial review

`tools/fit_bottoms.py` supplies same-argument 80×80 fitting for shorts/trousers/overall lower. Transfers source palette onto actual baseline navy trouser pixels rather than imposing standing lower-body rectangle. Walk/sit proofs for trousers-navy and overall-denim (64 poses) visually inspected: feet and bent legs are no longer concealed by source rectangle. Limitation: source pocket/seam detail is lost and exposed baseline knees remain exposed in seated frames, so this is a motion-safe simplified fallback, not finished long-trouser tailoring. Skirt intentionally excluded. Parent must integrate and evaluate combined clothing/shoes output.

### Knee coverage follow-up

`fit_bottoms(..., id='', handsmask=None)` now covers seated knee skin only for ids containing `trousers` or `overall`. The baseline `hands-mask` was visually inspected: it includes knees AND shirt regions, not only hands. Blindly subtracting it would preserve all exposed knees. Therefore a conservative, manually inspected per-direction/per-frame knee ROI table overrides that broad mask for this exact baseline; `handsmask` is accepted for call compatibility but not used as an exclusion mask. No generic anatomy segmentation claim. New walk/sit 64-pose trousers/overall proofs inspected: bent knees covered while hands remain flesh-colored. Shorts unchanged. Re-QA these ROIs if baseline frames change. Source seam/pocket detail loss remains.

## Final integrated rebuild recheck

After builder integration and refreshed proofs, visually rechecked all seven actions for shoes-sneakers, shoes-loafers, shoes-boots, bottom-shorts-charcoal, bottom-trousers-navy, bottom-overall-denim: 42 contact sheets / 672 pose thumbnails via six updated montages. No asset/code changes in this frozen recheck.

Confirmed in integrated output:
- Shoes follow separate visible feet in front/rear raised-foot frames and side spread stance; original fixed-pair issue is corrected.
- Shorts/trousers/overall lower no longer impose standing rectangles over walking feet or seated legs.
- Trousers and overall seated knee fabric coverage is present; hands retain skin coloration. Shorts retain exposed knees.
- All seven actions retain foot placements and no major detached footwear or new cell-edge truncation was found in this rechecked subset.

Remaining limitations: footwear is necessarily tiny, boot shaft/side-profile proportions still simplified; garment pocket/seam source detail is lost by pose-conforming recolor. This review does not certify unseen outfit combinations or runtime animation cadence. Initial sleeve and skirt articulation findings are not resolved by this footwear/lower-body recheck. The repeated/similar baseline walk phases also remain a baseline-motion issue, not solved by accessory fitting.

## PR3 follow-up: articulated sleeves, seated skirt, tailoring pixels

Implemented rather than only deferring:

- New `tools/fit_clothes.py::fit_top(z0, basecell, directionIndex, action, frame, id='', handsmask=None)` for top-shirt-blue / top-cardigan-rust / top-hoodie-lavender. Removes outer relaxed source sleeve areas, preserves central original torso/collar/front detail, fits a shorter torso when seated, and recolors the proximal 60% of baseline arm skin components using the garment palette. Distal hand skin remains visible. Raised greet and celebrate arms now carry garment-colored sleeves instead of a second relaxed sleeve being left behind.
- `fit_skirt` with same parameters: seated frames 1/2 use a wider, shorter lap silhouette and side-view forward shift. A garment-colored knee underlay prevents bare knee patches through the source waist transparency. Standing source silhouette retained in other frames.
- `fit_bottoms` now adds clipped one-pixel seam highlights and pocket-mouth stitching relative to the current moving fabric mask. This restores actual tailoring detail without putting a static standing pocket rectangle over the gait.

Standalone post-change rendered previews directly inspected for six items (shirt-blue, cardigan-rust, hoodie-lavender, skirt-coral, trousers-navy, overall-denim), all seven actions × four directions × four frames: 42 sheets / 672 pose thumbnails. Every action/direction was present; inspected as item montages, not claiming per-pixel native-size or browser playback verification. Source sheets were cleaned with the same connected-alpha-component threshold as builder before fitting.

Observed: raised-arm sleeve coloring follows current arm poses; no extra full lowered source sleeve at the sides, torso remains recognizable by buttons/zipper/hood. Seated skirt now lies across bent lap rather than extending as standing skirt. Leg seams/pockets track actual fabric mask and do not cover shoes. No new cell-boundary truncation observed in this subset.

Remaining polish, not the old unfixed behavior: sleeves use geometric proximal skin classification rather than a hand-painted elbow rig; cuff/hand boundary can be abrupt at 80px. Skirt lap is compressed source art with underlay rather than bespoke fold drawings; pocket stitching is newly constructed pixel detail rather than exact recovery of every source seam. Torso fit is intentionally narrower than the old garment-with-static-sleeves rectangle. Final builder integration and outfit-combination proof recheck remains parent's responsibility.

### Integrated PR3 follow-up closeout

Reopened the actual rebuilt `previews/individual` output after parent connected the modules, for top-shirt-blue, top-cardigan-rust, top-hoodie-lavender, bottom-skirt-coral, bottom-trousers-navy, bottom-overall-denim. Reviewed every one of their seven action contact sheets (walk/greet/drink/examine/sit/celebrate/dress), four directions × four frames each: 42 sheets / 672 poses, in six current output montages.

The renderer's restoration step does not revert the sleeve colors, skirt knee coverage or tailoring pixels in these single-item proofs. Integrated results retain garment sleeves along raised arms, shortened seated torso, forward lap skirt and current-pose leg stitches. No new major detachment or cell clipping found. This closes the specific fixed-sleeve, standing-skirt-on-seated-pose and blank-trouser-detail defects as implemented improvements; it does not claim hand-drawn-quality cloth folds or exhaustive mixed-outfit coverage. Distal hand/cuff transition remains simplified, and runtime animation cadence was not independently retested by this reviewer. No code/image changes made during this final integrated review.
