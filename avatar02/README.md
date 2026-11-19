# Avatar 02 — full customization catalogue (review candidate)

승인된 동글 기본형을 기준으로 만든 카페 퀘스트 조합 애셋입니다. **품목 커버리지 제공 단계이며 최종 게임용 리깅 완료본이 아닙니다.** 기존 앱과 메인 브랜치는 바꾸지 않습니다.

## Included
- 51 selectable entries: hair 10, tops 12, bottoms 7, shoes 3, hats 4, glasses 2, body accessories 4, handheld props 4, eye shapes 3, skin overlays 2 (plus original skin).
- Hair: short / curly bob / long straight / pixie / pigtails / braid.
- Tops: plain tee / striped tee / shirt / cardigan / hoodie / vest / overall upper. Alternate plain/vest entries retained.
- Bottoms: shorts / trousers / skirt / overall lower. Alternate shorts retained.
- Shoes: sneakers / loafers / boots. Hats: beanie / baseball cap / beret.
- Glasses: round / square. Body: mini bag / crossbody / headphones.
- Hand: mug / takeaway cup / book.
- Three eye shapes, each charcoal / green / blue; original, warm, deep skin.
- Front / right / back / left. Seven four-frame motions: walk, greet, drink, examine, sit, celebrate, dress. Idle is walk frame 1, **not a separate animated idle**.

## Preview
Serve repository root with `python -m http.server 8000`, then open `http://localhost:8000/avatar02/preview.html`.

The standalone viewer selects equipment, motion, direction and eye color, with pause/frame step and pixel-grid controls. No backend, app integration, account actions or deployment.

## Files and alignment
- `manifest.json`: item/motion/direction/layer mapping and warnings.
- `assets/<motion>/<item>.png`: transparent 320×320 atlases. Four 80×80 columns are frames 0–3; rows front/right/back/left. Nominal anchor `(40,74)`.
- `source/`: AI-created original part sheets and inherited v3 pose layers. Proportions reference approved 02; no intentional franchise costume/character copy.
- `previews/individual/`: 273 item-by-motion contact sheets, each showing every direction/frame (4,368 composed poses). File generation does **not** itself mean visual approval; see QA documents.
- `previews/*-combinations.gif`: six sample outfits across four directions; limited combination coverage, not exhaustive permutations.
- `tools/build_catalogue.py`: deterministic fitting compiler. `tools/render_proofs.py`: contact sheets/GIF generation.
- `test-viewer.mjs`: manifest/file/ordering and DOM test-double tests. **Not a real browser rendering or in-game test.**

## Rebuild
Python dependencies: Pillow, numpy, scipy. Then:
```
python avatar02/tools/build_catalogue.py
python avatar02/tools/render_proofs.py
node avatar02/test-viewer.mjs
```

## Important limitations
Generated static part silhouettes are scaled/translated to the inherited pose geometry. This is not hand-redrawn per-frame clothing or a skeletal animation rig. Shoes are now separated and fitted to detected individual base feet. Non-skirt bottoms transfer garment color onto the existing leg silhouette to preserve movement, sacrificing source pocket detail. Long-sleeve upper arms now follow poses; seated skirts use lap silhouettes. Bottoms include moving seam/pocket pixels. These are compact pose-aware pixel fits rather than full fabric simulation. Handheld props track the detected near hand and are intentionally hidden from the back. Books are stowed during drink rather than raised to the mouth. Hats now use 18 compatible hair variants preserving fringe, sides and rear mass. Eye styles preserve drinking, smiling and celebration expressions. Original source pose proportions vary slightly.

The output must be treated as a reviewable implementation starting point. Asset presence and automated checks are not evidence of final visual quality. Individual visual inspection findings, corrections and remaining polish are recorded in `QA-*.md`. The follow-up adds 21 hat/hair combination sheets (2,016 poses) and 9 skin/eye/palette sheets (324 poses).
