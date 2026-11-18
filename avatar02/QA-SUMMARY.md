# Avatar 02 visual QA and release boundary

**Updated 2026-11-18, v0.5 follow-up.** Standalone modular asset draft, not an app release. No main merge/deployment. Earlier findings in category reports are retained as history; later correction sections supersede them.

## Coverage
Initial full catalogue review: 39 individual items × seven four-frame actions × four directions = **273 contact sheets / 4,368 posed composites**. Each item was inspected directly or in labeled item mosaics, with suspected defects opened at full resolution.

Follow-up integrated review after corrections:
- Long sleeves, skirt and trouser details: 6 items × 7 actions × 16 poses = **672 poses**.
- Hand props and mini bag: 4 items × 7 actions × 16 poses = **448 poses**; final bag shoulder anchor and cup-sip tilt separately rechecked.
- Hat/hair combinations: 3 hats × 6 hairs × 7 actions × 16 poses = **21 sheets / 2,016 poses**.
- Expressive eyes: 3 eye styles × 7 actions × 16 poses = **336 poses**.
- Skin/eye/lens combinations: 3 skins × 3 eye styles × 3 palettes × 3 representative action poses × 4 directions = **9 sheets / 324 poses**.

Idle reuses a walk frame, so adds no unique pose. These counts overlap and are not a count of unique final images. Outfit permutations beyond the specified combinations are not exhaustively tested.

## Actual corrections
- Skin tint restricted to skin; original-eye cover preserves ear/jaw silhouettes.
- Side glasses face forward; rear glasses hidden to avoid eye-like marks on rear hair.
- Independent head-layer rotation removed; long rear hair shortened and correctly occludes the back; pigtail fringe raised.
- Headphone profile fits the ear. Footwear tracks individual visible feet rather than a stationary pair hiding gait.
- Bottoms follow baseline legs and bent knees; long trousers cover knee skin. Moving seam/pocket pixels restored.
- **Long sleeves now follow the proximal arm pixels**, removing fixed hanging sleeve shapes when arms lift.
- **Seated skirt now uses a wider/shorter lap shape**, with knee underlay rather than a standing box.
- **Cups draw after arm restoration and before a narrow skin-grip mask**. The shirt no longer paints over the cup. Drink front centers the cup between hands; profile sip frame adds a small contact-pivot tilt. Celebration positions preserve visible cup mass.
- Book stays teal in every direction, is stowed during drinking, and follows the hand for examination.
- **Mini bag moved from central waist to one shoulder/side hip**, with direction-consistent strap orientation; broad-face scanline anchor avoids drink-frame shoulder drift.
- **18 hat/hair variants retain fringe/side/rear hair**. Rear hat is restored after protected rear hair, preserving baseball strap/brim.
- **Eye choices preserve closed drinking eyes, seated smile, and celebration expression**, including lens palettes.

## Automated verification
- 623 RGBA atlases: dimensions, transparent cell margins, item/motion mappings.
- Viewer: 1,248 individual item/motion/direction plans and 2,632 file references, plus all 18 hat/hair × 8 motion × 4 direction layer plans and variant paths.
- Eye fitter: 1,008 pose/palette outputs and 12 expression-key cases.
- DOM/canvas test-double: load, render, pause, step, direction, equipment changes, grid, idle and reset.

## Runtime boundary and remaining polish
A real CUA Chromium was opened for testing, but `http://127.0.0.1:8773/avatar02/preview.html` returned `ERR_CONNECTION_REFUSED`: browser and execution workspace do not share localhost. **No successful actual-browser or in-game test is claimed.** No public deployment was created to bypass this limitation. Static frame sheets and sampled GIFs were used for visual inspection.

Remaining polish is finer than the corrected defects: compact source-derived pixel detail, simplified fabric folds/seams, precise finger/handle grasp, darker eye colors' contrast on deep skin, and rear long-hair coverage of torso gestures. Short hair fringes can naturally be mostly covered by a low brim. There is no dedicated page-turning/reading action or continuous fabric rig. This is a reviewable, pose-aware asset implementation, not final game integration or exhaustive visual approval of every possible outfit.
