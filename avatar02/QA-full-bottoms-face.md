# Full item QA: bottoms, eyes, skin

Date: 2026-11-18. Static renderer evidence, not a live-browser or animation-speed certification.

## Exact scope

12 items, each 7 source actions × 4 directions × 4 frames = **1,344 source poses**. Every one of the 84 individual PNG contact sheets was opened and visually inspected. Directions: front/right/back/left. Frames: 0–3. Actions: walk, greet, drink, examine, sit, celebrate, dress.

- `skin-warm`
- `skin-deep`
- `bottom-shorts`
- `bottom-skirt-pleated`
- `bottom-trousers-cargo`
- `bottom-shorts-charcoal`
- `bottom-trousers-navy`
- `bottom-skirt-coral`
- `bottom-overall-denim`
- `eyes-dot`
- `eyes-sleepy`
- `eyes-smile`

## Separate idle review

Manifest idle resolves to walk frame 1. Three newly rendered `previews/full-bottoms-face-idle-{1,2,3}.png` contact sheets were each opened and visually checked: **48 idle views**. These are duplicate source poses and must not be added to unique-art counts. No additional alignment defects found.

## Eyes × skin × lens sampling

All nine `previews/eye-palettes/skin-{base,warm,deep}--eyes-{dot,sleepy,smile}.png` sheets were freshly opened. This covers all 27 skin/eye/lens combinations at walk frame 2, drink frame 2, celebrate frame 1, in four directions: **324 sampled composed views**. The other action/frame combinations of these 27 combinations are not visually certified by this sample.

## Findings and regression checks

- No new blocking clipping, duplicate eyes, face-outline deletion, shifted garment, phantom limb, or pale original-skin hand patch found in this scope. No asset changes were needed in this pass.
- All seven bottoms follow standing and seated poses; default gray feet remain visible. Coral skirt has small visible foot tips in some poses. Pleated hem and cargo foot readability improvements remain present. This is not a claim that a previous severe foot-loss defect existed.
- Deep/warm skin remains on face and exposed hands without obvious cream-shirt contamination; specifically checked raised greet hands and drink/sit hand positions.
- Drink closed eyes, seated smile, and celebration curves override selected cosmetic eye shape in their intended frames. Back views remain eye-free. No visible skin-tone rectangles from eyeCover in the palette samples.
- Remaining polish: charcoal/green lenses have reduced contrast on deep skin; celebration curves are thinner than ordinary dot/sleepy eye pixels. Lens tint currently also tints closed-eye strokes. These are documented stylistic limitations, not hidden regressions.
- Shorts and trousers retain a similar narrow baseline silhouette; skirts/cargo are more visibly distinct. This pass does not redesign approved item silhouettes.

## Evidence and exclusions

`QA-full-bottoms-face.json` records exact file hashes, item/action/direction/frame matrices and separate idle/palette samples. Hashes pin the inspected evidence; regenerate/review after changes. The parent can combine the 1,344 source poses with the other three disjoint item scopes for 51 × 112 = 5,712 total source poses. Do not add idle or palette rechecks to that unique item-pose total.

This pass does not cover every multi-slot clothing/hair/accessory cross product, every palette animation frame, runtime timing, actual browser input, mobile hardware, game integration, or deployment. Those require their own evidence. Historical reports describe earlier defect corrections; this report is a new exhaustive pass of the stated 12 items only.
