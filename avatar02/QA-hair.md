# Hair / headwear / glasses visual QA

Reviewed 2026-11-18. Scope: 11 individual items × 7 actions × 16 poses = 1,232 posed composites. Opened actual rendered contact sheets arranged into seven-action item mosaics; suspected defects additionally checked in full-size originals. Directions are front/right/back/left; frame numbering 0–3. This is static pose/layer QA, not a claim that every combination or animation loop was runtime-tested.

## Coverage

Every listed item inspected in walk, greet, drink, examine, sit, celebrate, dress, with all four directions and all four frames visible:

- hair-short
- hair-curly-bob
- hair-pixie
- hair-pigtails
- hair-long-straight
- hair-braid
- hat-baseball
- hat-beanie
- hat-beret
- glasses-round
- glasses-square

## Findings / status

1. **P1, correction in progress: detached head layer in examine.** Clearly visible on hair-curly-bob, hair-pixie, hair-pigtails, hair-long-straight, hair-braid, hat-beanie and hat-beret; examine/right + left/frame 2. Rotated overlay exposes a crescent of bald head at the back/top. hair-short and hat-baseball are less visibly affected. Parent identified layer-only rotation and removed it. Initial rebuilt beanie and beret examine contact sheets no longer show the severe crescent. Full final 11-item examine recheck remains pending final integrated rebuild.

2. **P1, fix queued: reversed profile glasses.** glasses-round and glasses-square; all seven actions, right + left, frames 0–3. Lens is toward the back/ear and long temple points forward over the eye. Confirmed directly in full-resolution glasses-square--walk.png. Parent queued horizontal mirroring of each side overlay; final mirrored result has not yet been visually verified.

3. **P2, unresolved style/readability: excessive long-hair rear length.** hair-long-straight, back, all seven actions/frames. Hair nearly reaches feet and obscures torso/arm gestures. Consider shorter rear mass and explicit under/over body layering. It is recognizably long hair, but should not be described as shoulder-blade-length output.

4. **P2, unresolved face readability: low bangs.** hair-pigtails, front and side, across actions. Fringe overlaps upper eye area; eye shape is less readable than bald reference. Consider raising front fringe 1–2 native pixels. Curly bob also has a heavy fringe but is less severe.

No canvas-edge clipping or substitution with unrelated objects found in the reviewed headwear/hair sheets. Glasses rear temple stubs remain present. This does not establish approval of all combinatorial headwear + hair combinations.

## Superseded transient observation

Early beanie/beret mosaics showed missing bodies in front/back rows while build outputs were being regenerated. Direct current originals of both walk sheets show intact bodies; the stale/in-flight mosaic observation is withdrawn and is not counted as an outstanding asset defect. Final validation should be on a frozen completed build.

## Integrated-build recheck

Reopened all 11 examine contacts and all 14 glasses action contacts after the head/glasses freeze. **P1 findings 1 and 2 resolved in the reviewed build**: no prominent bald crescent, side lenses face forward and temples extend toward the ear. All four directions/frames inspected. This supersedes their pending statuses above.

P2 follow-up parameters patched in `tools/build_catalogue.py`, not yet visually revalidated: `hair-long-straight-rear` height cap 48 instead of 57; `hair-pigtails` origin moved upward two native pixels. Await rebuilt outputs to close these findings. No new source art generated.

## Final P2 recheck (frozen integrated output)

Opened rebuilt hair-long-straight and hair-pigtails contact mosaics for all seven actions, four directions and four frames (224 composites total).

- **hair-long-straight: improved, residual style limitation.** Height cap 48 takes the rear mass clear of the feet; legs now remain visible in back-facing walk/examine/sit/celebrate/dress. Front and side arm/torso silhouettes are appreciably clearer. Back-facing torso and inward arm gestures are still substantially obscured by the hair, especially drink and examine. That remaining coverage is a style/readability tradeoff, not a detached-layer bug. Do not claim full gesture readability or all outfit visibility from the back.
- **hair-pigtails: improved / adjustment verified.** Two-pixel upward origin clears more of the frontal eyes in all actions. Side bangs remain deliberately sweeping and heavy, but the visible eye is readable. No new bald crescent, canvas clipping or detached pigtail was observed. The prominent low-fringe issue is closed for this review candidate; further frontal fringe tuning is aesthetic rather than a blocking assembly defect.
- The earlier examine correction remains intact in both items.

No further code or image edits made during final frozen-output recheck. Remaining QA scope limitations: static per-item pose review does not certify every hat/hair/glasses combination or motion timing in runtime.

Final compositing follow-up: rear glasses temple stubs looked like eyes when drawn over long rear hair. Compiler now intentionally hides glasses in the back direction, superseding the earlier 'rear temple stubs remain' observation. Final rear composite is rechecked by the integrating reviewer.
Verified final glasses-direction contact sheet and long-hair/cardigan/glasses walk composite: rear eye-like stubs absent; front and both profile lenses preserved.

## Rear glasses update (supersedes earlier temple-stub observation)

Back-facing glasses are now intentionally hidden by the parent build. Earlier retained rear temple stubs read as false eyes over long hair in combinations, so retaining them is NOT an acceptance criterion. Final rear-glasses combination check is owned by the parent.

## PR3 hat-compatible hairstyle fitting

Implemented `tools/fit_hat_hair.py` without changing builder/viewer/render_proofs. Crown masking uses each hat cell's actual alpha bounding box: removes hair above 70% of cap height, retaining lower fringe/side/rear silhouettes. Hat is drawn last so its opaque brim covers hair naturally. This replaces the earlier whole-hairstyle suppression when a hat is selected.

API: `fit_hat_hair(hair,hat,direction=0,rear=None)` returns `front`/`rear` RGBA cells and `mask` L image. `fit_hat_hair_atlas` performs the same operation on 4×4 80px atlas grids. Front/profile rear goes behind base; back rear goes in front of base. Front hair goes before hat in all directions.

Direct visual review: all 6 hairs × 3 hats × 4 directions (72 combinations), walk frame1. Evidence saved in `previews/hat-hair/hat-{baseball,beanie,beret}-hair.png`. Confirmed selected hairstyle remains distinguishable under each cap, crown does not poke out, ponytails/braid/long rear retained, face and eyes remain readable. Short crop front fringe is naturally mostly covered by low brims, but sideburns/back hair remain; no blanket bald replacement occurs. These proofs check per-direction geometry, not all animation frames; caller must apply function per frame for correct moving anchors.

## PR3 integrated hat-variant full pose recheck

Reviewed actual integrated `previews/hat-combinations/{hatId}--{action}.png` outputs for **all 21 sheets**: 3 hats × 7 actions × 6 hairs × 4 directions × 4 frames = **2,016 posed combinations**. Opened every latest sheet after the final hat-restoration fix, with all rows/columns visible. Hats: baseball, beanie, beret. Hairs: short, curly-bob, pixie, pigtails, long-straight, braid. Actions: walk, greet, drink, examine, sit, celebrate, dress.

First integrated pass found the back-facing hair-protection composite covering the cap's rear strap/lower edge. Parent fixed final cap restoration. **Latest 21-sheet pass confirms this issue resolved**, including baseball rear strap visibility across all six hairstyles and seven actions. Front/profile fringe, side hair, pigtails and rear/braid identity are retained; no wholesale bald replacement, obvious detached cap, crown breakthrough or canvas-edge clipping observed. Examine frame2 remains attached.

Remaining non-blocking art tradeoff: low hat brims naturally hide most of the short-crop frontal fringe; sideburn/back-hair silhouettes still preserve the selected hair. Long straight rear hair continues to hide much of rear torso/inward gestures, as already documented. These are not new assembly regressions.

This is exhaustive static pose QA for the stated hat–hair matrix, not an exhaustive test of all other clothing/accessory combinations or a browser-runtime animation-timing certification. Viewer integration is owned by parent; this reviewer did not operate the live viewer.
