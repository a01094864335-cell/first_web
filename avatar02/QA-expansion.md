# Independent expansion QA (51-item catalogue)

## Actual visual coverage

Directly opened twelve 1280×725 actual-composite contact sheets, one for each new item, with every source action (`walk/greet/drink/examine/sit/celebrate/dress`), direction (`front/right/back/left`) and frame (`0..3`): **1,344 rendered poses**.

- hair-buzz, hair-afro, hair-high-bun, hair-side-ponytail
- top-raglan, top-turtleneck, top-bomber
- bottom-skirt-pleated, bottom-trousers-cargo
- hat-bucket, body-tote, hand-camera

Every composition uses `skin-deep` and `eyes-dot`. Non-top items also use `top-tee-striped`; non-bottom items use `bottom-trousers-navy`. The bucket hat is combined with `hair-side-ponytail`. These are genuine renderer layer composites, not raw uncomposited atlases. This checks each new part with existing items, not every possible new×new or legacy combination.

Full review sheets are deliberately kept outside the repository. Reproduce with `python tools/render_expansion_qa.py --output /path/to/review-folder`. The renderer and manifest used are the real catalogue versions. The corrected high-bun sheet was regenerated and directly reopened after the margin correction (112 additional repeated pose inspections).

## Findings

- No confirmed new blocking misalignment found in these samples. The distinct source silhouettes are visible and the simple pose fitting follows the baseline movement.
- Initially suspected pleated-skirt foot occlusion and cargo shoe tint from the reduced contact sheets. Enlarged skirt walk front/back frame 1 and cargo sit right frame 1 / left frame 2 confirmed that gray baseline shoes remain distinct. The preliminary concern was withdrawn, not recorded as a fixed defect.
- Camera disappears during drink rather than being lifted as a cup. Rear-facing hand prop remains hidden. This is a stow rule, not a photography animation.
- Bucket hat + side ponytail preserves hair below the brim; no bald-scalp flash noticed in these static poses.
- Afro/bangs visually cover part of the eyes, especially with deep skin and dark lenses; readability is weaker than the uncovered base. This is an art/readability consideration, not a new atlas alignment failure.
- Small side-view tailoring and source-derived silhouettes remain simplified. Full game-scale animated playback and all cross-slot combinations are not claimed as verified.

## Automated checks executed against 51-item integration

- `validate_assets.py --expected-items 51`: 1,015 referenced RGBA atlases; dimensions, cell margins, all action/palette/skin-cover maps, all 10-hair ×4-hat variants, and 39 legacy ID/slot preservation passed.
- `test-viewer.mjs`: 1,632 item/direction/motion plans; 3,392 ordinary file references plus variant/palette checks passed. DOM/Canvas test-double control checks passed. This is **not** real browser interaction.
- `test_fit_eyes.py`: 1,008 structural pose/palette outputs plus 12 semantic expression key poses passed.
- `test_clothes_fit.py`: 336 sleeveless structural pose checks passed.

The expanded validator is manifest-driven; optional `--expected-items` enforces the planned count without baking 51 into future releases. `baseline-item-slots.json` retains the prior 39-item identity contract so simply increasing the count cannot silently replace old parts. These checks do not prove pixel-identical legacy art or complete visual regression coverage.

## Subsequent preventative foot-readability adjustment

After the above full-sheet inspection, the clothing owner added explicit foot-region protection and raised the standing pleated hem by 2 px. Directly inspected the supplied enlarged before/after image: skirt walk front/back frame 1, skirt walk right frame 0, skirt sit right frame 1, cargo sit right frame 1 and left frame 2 (six pairs). Gray feet are more readable and no broken hem was apparent in these examples. This is a preventative readability improvement after the original blocker suspicion was withdrawn. The full 1,344-pose pass predates this small adjustment; only the stated six pairs were independently rechecked afterward at this point.

## Final integrated lower-body spot check

After the final integrated rebuild, directly opened a new 16-pose composite: pleated skirt walk frame 1 and sit frame 2, cargo trousers walk frame 1 and sit frame 1, all four directions, each with deep skin + dot eyes + striped tee. Default gray footwear remains visibly separate, skirt hem remains continuous, and seated lap/knee coverage is preserved in these final samples. This completes the requested 12–16-frame final spot check. No new blocking issue found. This small follow-up does not relabel the earlier full pass as a post-polish full pass.
