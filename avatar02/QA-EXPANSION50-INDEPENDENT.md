# Expansion 50 — independent static QA

Date: 2026-11-19. Reviewer: catalogue_qa, independent of the new asset fitters.

## Actual inspected scope

Opened and visually reviewed all **15** `previews/expansion50/catalogue-01.png` through `catalogue-15.png` images. These are actual manifest layers composited on the common base, not generated illustrative mockups. **50 new items × 4 directions = 200 idle views**. Column order is front, back, left, right. Source pose is `walk` frame 1 (idle alias). Each item is worn alone; common base clothes remain visible. Manifest contains 101 items.

## Result

No clear blocking fit or clipping defect found in these 200 views. All 50 catalogue entries are present and visibly identifiable to the extent allowed by the small body proportions. This is a bounded static review, not approval of all motions or combinations.

- Hair: ten distinct silhouettes/textures; rear head coverage and directional placement remain coherent. The low ponytail and twin buns are visible in the appropriate directions. No obvious blank scalp holes or detached hair in these idle views.
- Tops: sailor collar, button plackets, toggles, quilt seams, cape and apron straps remain differentiated. Neck/face and resting hands remain legible. Long-coat labels do not imply a full-length silhouette here: all tops are compact avatar-length adaptations.
- Bottoms: shorts/trousers use a similar compact silhouette; pinstripe, patchwork and rolled-cuff detail provide the main differentiation. Skirts have distinct wrap/tier/button details. Default feet remain visible. This review does not claim full-length trouser proportions have been redesigned.
- Shoes: all five sit at the feet; fronts and profiles show recognizable laces/straps/boot/closed-toe differences. High-tops vs sandals rely on small texture details at native scale.
- Hats: all six fit the bald base in the four inspected directions; crown/brim/earflaps are visibly different. No obvious clipping. Hair+hat combinations were not part of this independent pass.
- Glasses: four front silhouettes and profile stems sit at the eye line. Back invisibility is explicitly labelled and matches current renderer behavior, not a missing export.
- Body props: backpack rear body, satchel side/front bag, waist pouch and scarf read separately. No obvious detached prop in idle.
- Hand props: folded umbrella, plant and shopping bag remain distinct. Profile plant leaves approach the lower face but do not erase the eye. Back invisibility is intentional under the current renderer and is labelled. No independent dynamic hand-contact claim is made.

## Changes / residual limitations

No builder, asset, renderer or upload changes were made by this reviewer. No new defect fix/recheck was necessary for the inspected idle scope. Fine dark outlines and clothing details should still be assessed on target display sizes. Shape variety in trousers/compact coats is limited by the shared avatar template.

Not inspected in this independent pass: the other 3 source frames, seven-motion playback/timing, multi-slot cross products, all skin/eye palettes, live browser interaction, phone rendering, game integration or deployment. Other agents' 112-pose-per-item QA and baseline byte checks must be cited as separate evidence, not this review's work. Idle200 must not be added to source-pose totals as new art.

## Exact item inventory


### hair (10)

- `hair-bowl` — 바가지
- `hair-center-part` — 센터 가르마
- `hair-spiky` — 삐죽 머리
- `hair-wavy-lob` — 물결 중단발
- `hair-twin-buns` — 양쪽 번
- `hair-low-ponytail` — 낮은 포니테일
- `hair-swept-undercut` — 넘긴 언더컷
- `hair-dread-bob` — 짧은 트위스트
- `hair-curtain-bob` — 커튼 단발
- `hair-mullet` — 짧은 울프컷

### top (10)

- `top-sailor` — 세일러 블라우스
- `top-henley` — 헨리넥
- `top-polo` — 폴로
- `top-double-breasted` — 더블브레스트 코트
- `top-duffle` — 더플 코트
- `top-denim-jacket` — 트러커 재킷
- `top-kimono-wrap` — 랩 재킷
- `top-puffer` — 퀼팅 패딩
- `top-capelet` — 케이프
- `top-apron` — 앞치마 셔츠

### bottom (8)

- `bottom-shorts-scallop` — 스캘럽 반바지
- `bottom-shorts-athletic` — 트랙 반바지
- `bottom-trousers-patchwork` — 패치워크 바지
- `bottom-trousers-pinstripe` — 턱 슬랙스
- `bottom-trousers-cuffed` — 롤업 데님
- `bottom-skirt-wrap` — 랩 스커트
- `bottom-skirt-tiered` — 티어드 스커트
- `bottom-skirt-button` — 단추 A라인

### shoes (5)

- `shoes-high-tops` — 하이탑
- `shoes-sandals` — 스트랩 샌들
- `shoes-rain-boots` — 장화
- `shoes-mary-jane` — 메리제인
- `shoes-clogs` — 클로그

### hat (6)

- `hat-straw` — 밀짚모자
- `hat-newsboy` — 뉴스보이캡
- `hat-visor` — 선바이저
- `hat-chef` — 셰프모자
- `hat-rain` — 레인햇
- `hat-earflap` — 귀달이모자

### glasses (4)

- `glasses-cat-eye` — 캣아이
- `glasses-aviator` — 보잉
- `glasses-hexagon` — 육각
- `glasses-sport-wrap` — 스포츠 고글

### body (4)

- `body-backpack` — 백팩
- `body-satchel` — 사첼
- `body-waist-pouch` — 힙색
- `body-scarf` — 목도리

### hand (3)

- `hand-umbrella-folded` — 접은 우산
- `hand-flower-pot` — 작은 화분
- `hand-shopping-bag` — 종이 쇼핑백

## Evidence hashes

All below images were actually opened in this pass.

- `catalogue-01.png`: `1b680162e0d948d0a82538aef8705f5af32dcdb8eeadfa14b7f0b002a5845ed6`
- `catalogue-02.png`: `ad468b3794e4183a428f52f0ddf3be56251e74a836f874f460cec2a3a6d1cfbb`
- `catalogue-03.png`: `1cee2fe4de7a71f2cd0f3b1d40c550abde69e017f3505c8f80570a17c4f4e99b`
- `catalogue-04.png`: `4d9b39058db18aef02ce76e16ba982e2ba8deb6c713c665112e02824fbd0a0c1`
- `catalogue-05.png`: `4c3adb44a02acb7dfbec662e1dac6db8ca648157155d6ba2e3de8fc78a14f368`
- `catalogue-06.png`: `6b184330207fb8ac02f7f60b9c2302465ce9fe951a1501596479a195f00854fc`
- `catalogue-07.png`: `a02323132a21107d282cab401e4cf438154cbdd80d8b979f8e9b2022dbd55733`
- `catalogue-08.png`: `2d88ffa26126e295866a3122d9cb3a49eddf13a19f5728ed4690513d348b961d`
- `catalogue-09.png`: `f9cb50d92c6d9d0d3ef352b8ddb1ef953840e0f86530ac23d3eb09b0170f7116`
- `catalogue-10.png`: `3e25a8c84a7a4daac1fe94a40b5bc5ec5dbb8c7c6ffab1998993690baf7d6d4c`
- `catalogue-11.png`: `1eb8a3e0cfe8c89b0fa7dadb41388d36f40ef7c6e09bf8cd34b6584eff280e63`
- `catalogue-12.png`: `32bb076162f2ea572747cf4521b64765172a8d0e37e6113731b64085ec6503f5`
- `catalogue-13.png`: `5a56b893b904e08a0c2df30020601cb7b055c22d243a64de5c36b2c42aca84a6`
- `catalogue-14.png`: `210d7530eaec622d2f27a243bbaa3b7f1af3723ec99a3852ba65d89cdeaed44e`
- `catalogue-15.png`: `9bcfde13c01b965c7c19ae1aec2ae648dd2cd2b2eb215a231bcd1e0e78e61343`
