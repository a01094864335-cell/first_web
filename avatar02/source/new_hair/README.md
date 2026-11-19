# New hairstyles

Four distinct built-in image_gen calls, each creating a single new four-view transparent hairstyle source. Reference inspected before generation: approved avatar02 base sheet and existing shortstyles sheet. Reference used for pixel style, not copied as the new deliverable. No face/body in these overlays.

Row0 columns: front, right-facing profile, back, left-facing profile.

- buzz.png: close-cropped charcoal stubble, low crown, clean squared hairline.
- afro.png: short voluminous brown tight curls with cloudlike outline.
- high-bun.png: chestnut swept fringe and elevated crown bun.
- side-ponytail.png: auburn asymmetric ponytail tied at character right. Screen-left in front, screen-right in rear.

Prompt shared specification: transparent pixel-art wardrobe overlay; hair only; exactly one row of four equally spaced views FRONT/RIGHT/BACK/LEFT; same round human child head scale; thick dark pixel outline; coarse square pixels; 3–4 shade palette; restrained highlights; transparent face opening in front/profile; rear filled; generous margins; no text/grid/shadows. Per-item descriptions above supplied separately, one call per item. Built-in imagegen, not CLI, not recolored existing assets.

Fitting: `tools/fit_new_hair.py`. It thresholds alpha at 160 before bbox fitting (very faint generated edge pixels otherwise distort bounds). High bun preserves scalp scale independently and compresses only bun into available top margin. Side pony uses asymmetric skull anchoring rather than centering its full silhouette. `sources.json` requires builder dispatch to this fitter; generic width-only fitting is not sufficient.

Reviewed actual fitted images: all four items × 7 actions × 4 directions × 4 frames (448 poses), plus existing three hats × four items × four directions at walk frame1 (48 combinations). Evidence: `previews/new-hair/`. This is pre-integration helper QC; final builder/caller hat variants and new bucket hat remain integration checks. No obvious face/head leak or cell clipping in final reviewed set. High-bun front view bun is deliberately compressed/low due to fixed80px cell headroom. Afro is bulky but short; its rear covers part of shoulders. These are visible art choices, not frame-specific redraws.

Integration follow-up: high-bun headroom changed to `bh=min(10,max(1,top-1))` so the bun is compressed by at most one additional pixel while scalp anchor stays fixed; reserves y=1 instead of touching top edge. Parent owns rebuild and structural validator rerun.

New bucket hat integrated current renderer reviewed across all four new hairs × 7 actions × 4 directions × 4 frames =448 poses. All seven `previews/new-hair/bucket-{action}.png` actually opened. No crown breakthrough, lost side ponytail, detached cap or face leak observed. High bun is intentionally tucked under hat, with side/back hairstyle preserved. These bucket proofs were made before the final 1px headroom rebuild; that adjustment affects only the covered upper bun.
