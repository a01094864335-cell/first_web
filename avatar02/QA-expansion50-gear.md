# Expansion50 gear QA (16 new items)

## Scope
New generated source sheets: 5 footwear, 4 glasses, 4 body accessories, 3 hand objects. Existing source/atlas bytes were not edited by this worker. No commit performed.

Each of 16 actual-renderer contact sheets was opened and visually reviewed: 7 actions × 4 directions × 4 frames = 1,792 poses, with existing pixie hair and blue shirt. Idle is the reused walk frame and was visible in these sheets, not a new motion. This is not exhaustive Cartesian outfit-combination testing. Temporary evidence lives outside the repository under /tmp/gearqa.

## IDs
- shoes-high-tops — 하이탑
- shoes-sandals — 스트랩 샌들
- shoes-rain-boots — 장화
- shoes-mary-jane — 메리제인
- shoes-clogs — 클로그
- glasses-cat-eye — 캣아이
- glasses-aviator — 보잉
- glasses-hexagon — 육각
- glasses-sport-wrap — 스포츠 고글
- body-backpack — 백팩
- body-satchel — 사첼
- body-waist-pouch — 힙색
- body-scarf — 목도리
- hand-umbrella-folded — 접은 우산
- hand-flower-pot — 작은 화분
- hand-shopping-bag — 종이 쇼핑백

## Corrections / integration
- Glasses source profiles already point correctly; noProfileFlip is true. Rear glasses are intentionally empty. Sport shield intentionally partly covers the eyes.
- Backpack rear uses the outside-pocket direction, rather than the source's wearer-facing straps. Side source is reversed to keep the pack behind the torso. Front shows only shoulder straps.
- Footwear uses the baseline foot detector and independent foot placement; two shoes are not pasted as one fixed pair. Boot shaft is limited to 12 px to avoid knee overlap.
- Hand props follow the detected near hand, not a static torso anchor. Rear view occludes all three; all drink frames stow all three, so the character does not drink a flowerpot or umbrella. These are holding motions, not new planting/shopping/umbrella-opening interactions.
- Bottom overflow shortens the hanging object beneath a fixed grip rather than moving the hand contact. New helper preserves 1 px canvas margin.
- Backpack and umbrella revised contact sheets were regenerated and opened after the corrections.

## Remaining scope / quality limitations
Source silhouettes are generated raster artwork resized with nearest-neighbor and pose anchors, not individually redrawn animation frames. Small shoe distinctions become subtle at native size; full resolution sources preserve them. Scarves/bags are partly occluded by original arm masks, as expected. Test used the actual render function but independently generated temporary atlases; final coordinator builder crop/meta and final integrated manifest proofs still need recheck. No claim of exhaustive combinations or final production animation polish.

## Final integrated atlas review (2026-11-19)
The coordinator's final integrated `previews/expansion50-motion/{id}--{action}.png` outputs were reviewed as 16 per-item seven-action contact sheets, covering all 112 input sheets / 1,792 poses. These used the integrated manifest/renderer and unclothed baseline, separately from the earlier pixie/blue-shirt outfit pass. Temporary review contact sheets are in `/tmp/gearfinal` and not shipped. Bodies, hands, footwear and profile alignment matched the earlier anchor behavior; holding-object rear/drink suppression is intentional. No browser interaction test was performed in this worker; coordinator reported a socket-permission blocker, so raster proof inspection must not be described as browser QA.

Found one additional defect: hexagonal glasses had pale opaque lens fill that obscured eyes. With coordinator agreement the new-only helper now lowers alpha of bright neutral lens pixels to 45, retaining dark outline and temples. Other 15 items / 1,680 poses were accepted at this review scale. Rebuilt hexagon's 7 integrated sheets / 112 poses are pending final recheck; no existing item was modified.

### Hexagon final recheck completed
After coordinator rebuild, all seven updated integrated hexagon sheets (112 poses) were re-opened as a seven-action contact sheet. Front eyes and side eye are now visible through the lens, dark hexagonal rims/temples remain readable, rear remains intentionally absent, and no new alignment regression was observed. This closes the pending raster QA item above. Final scope is all 16 assigned items / 112 integrated sheets / 1,792 poses reviewed, with hexagon's 112 poses re-reviewed after correction. Browser interaction and exhaustive combinatorial outfits remain outside this verified scope.
