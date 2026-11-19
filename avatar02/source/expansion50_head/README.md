# Expansion 50: head source catalogue (16 items)

10 distinct hairstyles and 6 hats, each generated with a separate built-in image-generation call. `sources.json` records IDs, labels, design prompts, original generation paths, and copied project-bound source paths. The original generation outputs are not runtime dependencies. Four source columns: front, right-facing profile, rear, left-facing profile. Transparent RGBA wearable-only source art.

Integration: `fit: expansion50_head`; import `fit_expansion50_head` from `tools/fit_expansion50_head.py`. Signature `(z0, base, direction, action=None, frame=0, id='', handsmask=None, meta=None) -> RGBA 80x80`. No rear helper needed for these short/chin/shoulder-level silhouettes. Existing builder/source/fitting files were not edited by this worker.

## Visual fitting QA
`qc/{id}.png`: 16 contact sheets, seven actions each, four directions and four frames, 1,792 poses. All 16 were directly viewed after initial fitting. Four changed items (low ponytail, straw, twin buns, visor) were then rendered again and all seven-action contacts re-opened after fixes.
- Low-ponytail front generated disconnected rear tail looked like a chin beard. Removed that island in front only; tail remains in profiles/rear.
- Straw source underside oval wrapped bald forehead. Suppressed hidden underside arc in front/profiles; retains crown and broad brim.
- Visor initially hid eyes. Reduced vertical extent and raised band. Open top remains transparent.
- Twin-bun fringe raised 2px to improve face visibility.
- Rain source front neck flap was opaque across face; masks central face opening, retains side/rear neck protection.

All new sources have identifiable silhouette differences; no color-only duplicates. No confirmed new blocker in single-item fit contact checks. Rear longer hairstyles can naturally obscure shoulders/inner arm details. Twin-bun bangs still overlap upper eye pixels in profiles; stylistic fringe, not proof of perfect face readability at every scale.

## Important integration requirement
`hat-visor` must NOT invoke ordinary crown-removal hat fitting. Preserve full original hair/front and rear layers and composite visor above them. Other five new hats may use existing hat-fit variants but must be checked after coordinator integration. All hair/hat combinations and actual browser canvas have NOT been checked by this source worker. Contact sheets are base+new overlay checks, not final hand-mask/render pipeline certification.

Reproduce source fitting contacts: `python tools/preview_expansion50_head.py`. Scope fixed to own 16 source specs. No commit/push performed.

## Final integrated atlas recheck (2026-11-19)
After coordinator build, directly viewed every actual `previews/expansion50-motion/{id}--{action}.png` for these 16 IDs via seven-action mosaics retaining all cells: 16 × 7 × 4 × 4 = **1,792 final integrated poses**. This is a separate pass from the earlier source-fitter contacts. The last four fitting corrections are visibly present: no front ponytail beard, no straw forehead oval, raised twin-bun fringe and raised/shorter visor. Rain front face window is also preserved. No new confirmed blocker found in this pass; prior fringe/shoulder occlusion limitations remain.

Also rendered and visually opened six `qc-integrated/hat-*.png` sheets using the actual `render_proofs.render` compositor: **10 new hairs × 6 new hats × 4 directions × walk frame 1 = 240 combination views**. The visor retains uncut crown hair, including tall spiky silhouette. Other hats cover crown while preserving lower fringe/side/back. No new confirmed blocker in these samples. This is not all 200 hair/hat pairs and not all motion frames of each pair; old/new cross-combinations remain outside this worker's latest visual scope. Real browser canvas not checked here.
