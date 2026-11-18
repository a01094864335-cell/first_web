# Full head-item visual QA — 2026-11-18

## Snapshot and actual visual scope
Current local 51-item build, after the high-bun top-margin correction. Manifest SHA-256: `fc6ad17c805252d6bf00ed9b9f7c8dcec2da89615132aedcb0041a709219d7d7`.

Viewed actual `previews/individual/{id}--{action}.png` output through 16 seven-action contact mosaics (all cells retained; 2x image downsample for inspection). Each item: walk, greet, drink, examine, sit, celebrate, dress; front/right/back/left; frames 0/1/2/3. **16 × 7 × 4 × 4 = 1,792 item poses visually inspected.** These are single-item-on-base renders, not all wardrobe combinations.

Separately rendered and viewed `previews/full-head/idle-0.png` and `idle-1.png`: **64 idle direction views**. Manifest idle is walk frame 1, so these are duplicates, not 64 new animation frames.

| Item | Seven-action poses | Separate idle views | Result |
|---|---:|---:|---|
| hair-short | 112 | 4 | checked |
| hat-baseball | 112 | 4 | checked |
| glasses-round | 112 | 4 | checked |
| hair-curly-bob | 112 | 4 | checked |
| hair-pixie | 112 | 4 | checked |
| hair-pigtails | 112 | 4 | checked |
| hair-long-straight | 112 | 4 | checked |
| hair-braid | 112 | 4 | checked |
| hat-beanie | 112 | 4 | checked |
| hat-beret | 112 | 4 | checked |
| glasses-square | 112 | 4 | checked |
| hair-buzz | 112 | 4 | checked |
| hair-afro | 112 | 4 | checked |
| hair-high-bun | 112 | 4 | checked |
| hair-side-ponytail | 112 | 4 | checked |
| hat-bucket | 112 | 4 | checked |

## Result and remaining art limitations
No newly confirmed blocker in the inspected 1,792 single-item poses or 64 idle views. Side-view examine frame 2 follows head tilt without the former detached hair/cap crescent; glasses stay on face and are absent from rear view by design. Hair and cap silhouettes remain inside their cells at contact-sheet inspection scale.

- `hair-long-straight`, back, all seven actions/all four frames: rear mass intentionally covers much of torso and inner arm gestures. This remains a readability limitation, not removed in this pass.
- `hair-afro`, back, all seven actions/all four frames: voluminous rear silhouette covers shoulder/upper torso area. Feet remain visible.
- `hair-high-bun`, front/back, all seven actions/all four frames: bun looks flatter than source art because fixed canvas headroom compresses bun only. No body/head repositioning performed in this pass. Pixel boundary correctness is covered by separate asset validator, not inferred from reduced contact sheets.
- Low hats conceal much of short frontal fringe. Side/back hair remains. This is not a claim that every fringe is equally visible.

## Additional combination sampling
Rendered using the actual `render_proofs.render` function (not a new independent compositor), then visually opened all eight `previews/full-head/hat-*-{walk-f1,examine-f2}.png` pages:
- 10 hairs × 4 hats × 4 directions × 2 sampled action/frames = **320 combination views**.
- Samples: walk frame 1 and examine frame 2; covers all 40 hair/hat pairs at neutral stance and the most tilted head pose.
- Checked crown clipping, retained fringe/side/rear hair, cap rear straps, high-bun tucked beneath hats, and no exposed bald scalp crescent. No new blocker found.
- This is NOT a 40-pair × 7-action × 4-frame visual census. Remaining combination frames were not newly inspected in this pass.

## QA tooling defect corrected
`tools/render_hat_proofs.py` had height fixed at 2100 pixels, enough for six hairs only. With ten hairs it silently cropped the last four rows out of the proof image. Changed height to `ceil(hairs/2) * 700` and replaced stale 21-sheet success count with dynamic counts. This changes proof generation only, not runtime assets or fitting. New sampled proof generator `tools/render_full_head_samples.py` uses correctly sized pages and all ten hairs are visibly present, including buzz/afro/high-bun/side-ponytail.

## Explicitly not covered
No real browser canvas interaction in this pass. Python proof rendering is the visual evidence. No full Cartesian product of hair/hat/glasses/eyes/skin/clothes/hand props. The prior helper pixel-parity test is separate evidence and does not certify whole browser compositing. No runtime helper/viewer/builder or source-art edits were made for this pass.
