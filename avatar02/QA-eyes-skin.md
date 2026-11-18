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
