# Eyes / skin visual QA

Status: review candidate, not production sign-off. Static contact-sheet inspection; no actual browser interaction or animation playback verified here.

## Actually inspected scope

Opened each of the following 35 PNG sheets directly at its 640 × 700 presentation size, inspected all rows (front/right/back/left) and columns (frames 0/1/2/3): 560 posed composites total.

| Item | walk | greet | drink | examine | sit | celebrate | dress |
|---|---|---|---|---|---|---|---|
| skin-warm | viewed | viewed | viewed | viewed | viewed | viewed | viewed |
| skin-deep | viewed | viewed | viewed | viewed | viewed | viewed | viewed |
| eyes-dot | viewed | viewed | viewed | viewed | viewed | viewed | viewed |
| eyes-sleepy | viewed | viewed | viewed | viewed | viewed | viewed | viewed |
| eyes-smile | viewed | viewed | viewed | viewed | viewed | viewed | viewed |

Files: `previews/individual/{item}--{action}.png`. This review covers each item with the default base, not every combination of skin/eyes/palette/accessory.

## Findings before correction

- Skin-warm and skin-deep: no obvious residual shirt-color contamination in the 224 poses. Face/hand skin matches within each palette. Silhouettes and body remain inside cells.
- All three eye styles: eye cover erased parts of profile ear/cheek/jaw outlines, especially right-facing walk/sit/dress and left-facing dress frame 3. This was a blocker for approval.
- Small residual facial marks appeared around some replacement eyes; these should be assessed after the mask fix. Not every small mark is a duplicate eye: some are deliberate face shading or mouth.
- Eye selection uses a fixed expression over the animation: replacing eyes loses the closed-eye drink frame / smiling sit expression in the base. This remains a motion-expression limitation, not a claim that all facial articulation is preserved.
- No eyes appear on back-facing heads, and no cropped heads/feet or obvious unintended displacement appeared in the inspected contact sheets. Temporal drift cannot be fully verified from static sheets.

## Correction implemented

Only the eye-cover detection loop in `tools/build_catalogue.py` was changed. Eye candidates now must be compact components within the face interior, lie on the forward half for profiles, and stay at least 3 pixels from the external silhouette. Dilation is constrained to the interior. This excludes disconnected ear/jaw outline fragments previously classified as eyes and avoids putting skin pixels outside the character silhouette.

Post-rebuild visual checks are recorded below.

## Post-rebuild review, first pass

Reopened all 21 eyes sheets (336 poses) after the interior/forward-half mask fix. Ear and jaw silhouettes are restored in the previously failing profiles. Found one remaining old-eye overlap in **celebrate / left / frame 1**: the head-relative lower bound was too strict for the raised pose. Relaxed the candidate lower bound from head-top +14 to +12 while retaining compactness, forward-half and silhouette-distance guards. Final rebuilt celebrate verification follows below.

The fixed expression limitation remains. Tiny non-eye facial marks/anti-aliased edges exist in the source; no claim of pixel-perfect hand-cleaned sprites is made. Green/blue eyes with both alternate skins and all accessories were not exhaustively visually combined in this task.

## Final frozen-build check

Reopened all three final celebrate sheets (`eyes-dot`, `eyes-sleepy`, `eyes-smile`), all 48 poses. The left-facing frame 1 old-eye overlap is resolved in all three variants. The ear/jaw contours remain intact. No additional code or image changes were made in this final pass.

Final coverage: 35 initial sheets / 560 poses, then 21 eye sheets / 336 poses after the main correction, then 3 celebrate sheets / 48 poses after the final threshold correction. These are repeated inspection counts, not 944 unique assets. The last threshold change was visually rechecked on celebrate only; no claim of a second exhaustive inspection of all final frozen assets.

Outcome: the observed mask blockers are corrected. Review-candidate status remains because fixed expressions, subtle source face marks, cross-slot/palette combinations and real-browser animation have not all received exhaustive visual validation.

## PR3 continuation: pose-aware cosmetic eyes

The previous fixed-expression limitation is now addressed for the requested key poses by `tools/fit_eyes.py`:
- drink frame 2 copies the base's actual closed-eye pixels.
- sit frame 2 copies the base's actual smiling-eye pixels.
- celebrate frames 1 and 3 use a joyful closed-eye arc aligned to detected eyes.
- Other frames retain the chosen dot/sleepy/smile cosmetic silhouette. Back directions remain blank.
- Charcoal/green/blue palettes are rendered through the same pose-aware function. Palette changes no longer recolor light blush pixels as if they were iris pixels.

Visually opened **all 21** newly rendered `previews/eyes-motion/{eyes-dot,eyes-sleepy,eyes-smile}--{walk,greet,drink,examine,sit,celebrate,dress}.png` sheets, all 336 poses. Closed/smiling keyframes are visible, profiles retain ears/jaw, no original-eye overlap noticed in these poses. The final integrated `previews/individual` pose areas (excluding only title text, y<30) were then compared pixel-for-pixel to all 21 inspected module proofs: **all identical**. Thus the actual integrated pose images match what was visually reviewed; this is not a claim of a second direct opening of 21 identical files.

Automated tests: 1,008 pose/palette outputs have correct 80×80 size and rear-eye visibility; all 12 semantic expression key poses consistently override all 3 cosmetic choices. Tests inspect output structure, not subjective art quality. Green/blue palettes were not each exhaustively visually opened. Celebrate arcs are deliberately simple and thinner than some cosmetic shapes; a fully hand-drawn facial-expression library remains future polish.

Viewer continuation: hat-specific hair variants replace the old blanket hair hide when available. Hand props restore the arm layer before drawing the prop, then restore only grip pixels after the prop. The existing back-hair protection is retained. Node helper and DOM/Canvas test-double checks pass with the integrated manifest; these are not actual browser interaction tests.

## Additional skin × lens palette visual check

Directly opened all **9** `previews/eye-palettes/{skin-base,skin-warm,skin-deep}--{eyes-dot,eyes-sleepy,eyes-smile}.png` sheets (640×1510). Every sheet contains charcoal/green/blue, walk frame 2 / drink frame 2 / celebrate frame 1, and all four directions: **324 composed pose samples** reviewed.

- Skin-matched eye-cover patches blend without obvious pale rectangles or face silhouette erasure in these samples.
- Charcoal, green and blue visibly change the intended eyes. Skin, clothing, hands and head highlights do not change with lens selection.
- Drink closed-eye and celebrate joyful-eye keys remain active for every selected eye shape and palette. No eyes appear on the rear head.
- No newly blocking mismatch found in this sampling. Deep skin plus green/charcoal eyes has lower facial contrast, especially the thin celebrate arcs. This is an art-polish concern, not a claim of equal readability for every palette at game scale.
- Current palette semantics color closed eyelids as well as open eyes; a separate dark eyelid/colored iris design would be a future art choice.

This extends palette coverage only for the three sampled poses above. It is not exhaustive visual testing of all 7 actions × 4 frames × skin × palette combinations, nor browser animation playback.
