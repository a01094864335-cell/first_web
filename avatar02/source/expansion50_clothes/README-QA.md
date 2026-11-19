# Additive 18-garment source catalogue and fitting QA

18 individual built-in imagegen calls generated one four-direction source each. All 18 source rows were visually opened. Four columns are front/right/back/left. Sources are transparent isolated garments, not recolors of existing assets.

## Items
- top-sailor — 세일러 블라우스
- top-henley — 헨리넥
- top-polo — 폴로
- top-double-breasted — 더블브레스트 코트
- top-duffle — 더플 코트
- top-denim-jacket — 트러커 재킷
- top-kimono-wrap — 랩 재킷
- top-puffer — 퀼팅 패딩
- top-capelet — 케이프
- top-apron — 앞치마 셔츠
- bottom-shorts-scallop — 스캘럽 반바지
- bottom-shorts-athletic — 트랙 반바지
- bottom-trousers-patchwork — 패치워크 바지
- bottom-trousers-pinstripe — 턱 슬랙스
- bottom-trousers-cuffed — 롤업 데님
- bottom-skirt-wrap — 랩 스커트
- bottom-skirt-tiered — 티어드 스커트
- bottom-skirt-button — 단추 A라인

## Integration
`fit: expansion50_clothes`; function `fit_expansion50_clothes(z0, basecell, directionIndex, action, frame, id='', handsmask=None, meta=None)` returns 80×80 RGBA. Existing 51 files and fitting modules were not edited by this worker. Builder integration and production atlases are coordinated by the parent.

## Actual visual QA
Standalone generation used the same four-column largest-component source crop as the builder and the current renderer's real layer order/hands restoration. All 18×7 actions×4 directions×4 frames = **2,016 outfit pose views** were rendered and each of the 18 seven-action contact boards was opened and visually inspected.
Actions: walk/greet/drink/examine/sit/celebrate/dress. Outfit context: hair-short, skin-warm, shoes-sneakers; tops paired with bottom-trousers-navy, bottoms paired with top-tee-plain.
Evidence exists at workspace `avatar-expansion50-clothes-qc/{id}.png`. This is standalone proposed-output QA, not verification of the coordinator's subsequent production build or deployed app.

No definite detached garment/phantom hand/new leg/covered shoe blocking defect was found in these contact views. Cape uses a broader sleeveless drape and retains posed skin; three skirt types retain different source hems and use the existing seated lap treatment. Trousers preserve original posed leg alpha while mapping source texture, adding visible pinstripe, patch or cuff treatments rather than changing only color. Front apron pocket and rear crossed straps distinguish the apron; sailor rear collar, duffle toggles, double-breasted buttons, quilted puffer segments and wrap diagonal were visually recognizable.

## Limits
This is constrained 80px paper-doll art. Coats are compact rather than truly full length; long sleeve fabric detail simplifies on moving arms. Trouser shapes retain the baseline silhouette for pose safety; their construction differences are primarily seams, cuffs, patches and texture. Short-sprite scallop and drawstring details become small. Source torso detail is resized, not individually hand-drawn per frame. Continuous animation playback, every accessory/skin combination, and final merged renderer have not been checked in this worker pass. Idle duplicates walk frame 1, included among the inspected source frames but no separate idle screenshot was taken.

## Source checksums

3b716ec4d2cb78b79963236ec889b402605b4ba867cdd295cc668122aa3123a9  top-sailor.png
f6ac59bf0b83efc442e778d7c5bcd15235970ea9c520aadb123791b9280b51ab  top-henley.png
ef228a17cd6a3f70a8cbe8f56a8a721f6c846811754d635179e4a5d42cc34b33  top-polo.png
240975d5afa4cda35026915aeceaa7db93dcf19ad77ac76a4055c1c39251a665  top-double-breasted.png
ee5358848867039a190ac7e20cc9fad0ac9566e0b9f50fa56c6e9fbecce73a4a  top-duffle.png
90bd653138e08df3e4b890ebd20a84ce0558becd554464357e20dd9bbce67435  top-denim-jacket.png
17bca687eaab584c10758aef160b2d5e741e3470dce69027303467dfe0227bf8  top-kimono-wrap.png
045cc768fc0e245e6ca8e0f628162b0d011f80883e831c03aec29a7161bf61b8  top-puffer.png
bbb640088b2e98955a5925e25e69687006ef508f15ad8ffc734a09b02ff08a16  top-capelet.png
482018976514a913b6d0aa62872f74306b32d0f2ce6bc559764fc3fd46d62db8  top-apron.png
e42c24ed555f4603d36bdedca59f858411d81974d87a2d69761f35b9ce76ef6f  bottom-shorts-scallop.png
c21f60e00d4368d154254661e487ed3118f1fe989fc782ae862746348331c6b5  bottom-shorts-athletic.png
826c8a3f0f6eb26734c697d708e64b710ee4101bbbf5def047b7557716533491  bottom-trousers-patchwork.png
7af1b125f0815d3381084cd055d20683df370fc18397d3b6ec54aa1834d73b1c  bottom-trousers-pinstripe.png
c65e0291036bac2a219694b2edd229e4620936fa5c7bcf48243f54a338a0b3a2  bottom-trousers-cuffed.png
d9ec370c72f698dde48d018327825374ec453d6705911d796e5c7069e5d5bb75  bottom-skirt-wrap.png
99e24a052ab1cefef02401ba7b69f2d040616d95883c861c353faeeae380a33c  bottom-skirt-tiered.png
2dff8c80520e0db2bdb5281a98ead594b15e2d78209854f09d8f010f521705c4  bottom-skirt-button.png
## Integrated build recheck · 2026-11-19
After the coordinator's final build, all **126 actual production proof sheets** at `previews/expansion50-motion/{id}--{action}.png` for the 18 IDs above were arranged into 18 readable seven-panel contact boards and opened visually. All **2,016 production item/pose views** (18×7×4×4) were included; none of the assigned action/direction/frame cells was omitted. Evidence montages: workspace `avatar-expansion50-clothes-integrated/{id}.jpg`.

This second pass checked the baseline wearing each newly built garment, whereas the first pass used a complete warm-skin/short-hair/sneaker outfit. Neck/torso attachment, raised sleeves, side seated lap, rear garment structure, trouser knees and exposed feet remained consistent with the standalone fitting results. No new confirmed blocker or integration regression was observed at contact-sheet viewing scale. No helper modification was made after the freeze. This is actual final-build static image inspection, not browser animation playback or exhaustive Cartesian outfit-combination testing. Browser/socket validation remains outside this worker's verified scope.
