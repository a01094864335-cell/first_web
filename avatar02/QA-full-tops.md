# Full tops visual QA · 2026-11-18

## Exact inspected coverage
Latest local 0.7-wardrobe-expansion output, not a remote deployment claim.
All 12 top items below were inspected in actual worn `previews/individual/{id}--{action}.png` output. Seven original sheets were arranged per item and visually opened as a contact montage; this is not merely an asset-file count.

Each item: walk, greet, drink, examine, sit, celebrate, dress; front/right/back/left; frames 0–3. **84 sheets, 1,344 distinct item/pose views.**

- top-plain — 7/7 sheets, 112/112 pose views
- top-vest — 7/7 sheets, 112/112 pose views
- top-raglan — 7/7 sheets, 112/112 pose views
- top-turtleneck — 7/7 sheets, 112/112 pose views
- top-bomber — 7/7 sheets, 112/112 pose views
- top-tee-plain — 7/7 sheets, 112/112 pose views
- top-tee-striped — 7/7 sheets, 112/112 pose views
- top-shirt-blue — 7/7 sheets, 112/112 pose views
- top-cardigan-rust — 7/7 sheets, 112/112 pose views
- top-hoodie-lavender — 7/7 sheets, 112/112 pose views
- top-vest-moss — 7/7 sheets, 112/112 pose views
- top-overall-denim — 7/7 sheets, 112/112 pose views

An additional `previews/full-tops-qa/idle-all.png` was generated from the current renderer and visually opened: all 12×4 directions, idle = walk frame 1. These 48 views are duplicates of the source poses, not 48 extra unique animation frames.

## Combination check
The current `render_proofs.render` compositing function was used, including hands restoration. Every top was combined with skin-deep, hair-short, eyes-dot, bottom-trousers-navy and shoes-sneakers. All four directions were visually checked for greet frame 1, celebrate frame 1, sit frame 1 and drink frame 2: **192 additional outfit views** in `previews/full-tops-qa/combos-{0,1,2}.png`.

## Findings
- No newly confirmed blocking top-fit defect in this inspected set. No floating whole torso, detached collar, phantom original-source hand, or top-colored shoe was observed.
- Plain/striped/mint tees follow the baseline shoulder and arm geometry; raised-arm greet/celebrate and seated poses were explicitly included. Stripes remain horizontal and clip to the garment rather than projecting beyond it.
- Raglan blue shoulder/white torso, turtleneck ribbing, bomber zip, cardigan opening, hoodie hood and overall rear straps remain distinguishable. Neck/torso attachment persists in the reviewed poses.
- Long-sleeve silhouettes remain procedurally pose-fitted, with simpler upper-arm detail than the generated torso art. This is a quality limitation, not a newly discovered detached-part defect. The tiny torso also compresses tailoring details.
- In the tested deep-skin outfits, hands remain distinct from garment colors and trousers/shoes do not acquire tee colors.

## Changes and limits
No fitting code, atlases or builder changed during this audit, because no confirmed new top defect warranted a speculative adjustment. Added only this report and four evidence images.
All assigned single-item source poses and idle duplicates were viewed. Not tested here: every Cartesian clothing/accessory combination, every skin/hair/lens option, browser playback at runtime speed, device-specific scaling, or every native pixel at magnified resolution. Contact montage inspection is visual QA at readable character scale, not proof that every possible combination is artifact-free. Other slot audits remain separate.

## Reviewed sheet fingerprints
Fingerprints bind the review to these exact local source proof files. A subsequent rebuild that changes them requires a delta recheck.

```
3601350eb292feef55d1c99237834b7720e123251ef01e0758754a1bc6bb9468 top-plain--walk.png
955bcb385c8ca9cbe380d99d65fff93828aa4501fdf7edeab78b5ece0424bd74 top-plain--greet.png
0bb182aaad7e9f85330b96b623eaa8a34e4a4685591e7d0a3584d35e27b50b94 top-plain--drink.png
c4647e0f287c02a6fdd13e91bfd64c72b5f56d64412a7af28aa0db1c9a311c54 top-plain--examine.png
629e732edf36ef09b9603ef1d2963ed94cf8d3cae0eac61bb918b4939517ffcf top-plain--sit.png
c6b2a2fa18cacef6dceda25690bf5555a2d8600c6037ff30aeb0ef85498e600c top-plain--celebrate.png
37e5588f7bf980299a09814d3567ac4de13f260ec298fa07e77f5674cb54200c top-plain--dress.png
27b5555d1dfffc29d701bd5c5f445fb9153f2d06c5b7cf952e6681e3f62361da top-vest--walk.png
7f25b89308b68b046228e60f1cc6a63f6590d9efe569ae884c7e2634d1da2896 top-vest--greet.png
1dd3fc44bd076aa2e137cd36baa7bacf85e8e3591ba486e9516037c9859d7830 top-vest--drink.png
1588ee5b6a3cded08bd1988dac1c827f70e28f5b0e08b8382b04c90883ead034 top-vest--examine.png
cab5b98c2309307bf6293441642454554b5981adfb4ed768542f2bff54680dca top-vest--sit.png
9ee29439e071943bd52e57b899912400fdd2654c7f85965efd00b803d61d56ba top-vest--celebrate.png
694647eb02ef226ca882e729c1d371d48cb72fcb77c2a4b8a4bbf6919fe6a936 top-vest--dress.png
66e702ab9b8e6d824bf695e29d13d2259e388adf3cbd9eed48a20a7642870a54 top-raglan--walk.png
6856238c812a747bf219e027add3b2026162302a22e49a001939d4ba3767ea82 top-raglan--greet.png
0585f2c49de918d7b97a1ab6a49cea7b301884e5f2188e5e6887656fff310867 top-raglan--drink.png
04761cbe2a7cce113853ea473eb26d6c7644b56bf39d59668b4a6074189a3fdc top-raglan--examine.png
ef8e01b8e518d8a3dfdd21e2605409c504c3df74383fa205069e7693d54dcbad top-raglan--sit.png
78622b8ec6af93e4af32c73c774ba9f99d5d55fb177b8e49e14bc24ba892545e top-raglan--celebrate.png
adcd10cdcda2c103f85b509ee440452e2869963fea794e5698101068a9c9f3bb top-raglan--dress.png
2f070faa089b0a851ecef7f46c9adbb5b302b5e1a41f4416a76334c17f497431 top-turtleneck--walk.png
e6905fd09b297c4785a17ed9634f74f2dc938c16366c2ae76025587d1bb199e1 top-turtleneck--greet.png
376ecaeefe9aff9f201324df52fadaab008a07d5ae86d5c0bbade37cc28b72f7 top-turtleneck--drink.png
37dcd675e2dc115e1beb8bc677ef8eb96ecd27c4dc097041a57d5fa29c6d03a3 top-turtleneck--examine.png
b237c2496acb3be26d453ec316e59135de2229c1ccf2c2d2856fc3ea21c0ec9f top-turtleneck--sit.png
eb6edf9ec906044c25a00367239b13d18bd9e682d7fee18ef3de830673c8c3b7 top-turtleneck--celebrate.png
60c45b70e821463de7851e586cd81fb89d2d48934ff2f3773f1db06418e0d796 top-turtleneck--dress.png
06777ee1333826276a46880db0bddadc7e9ac0d09b58c77c74a345dc73a81a07 top-bomber--walk.png
9ce041b722885ba8fdf254156a642403436bc700ccda9fac411965c4b9ad148e top-bomber--greet.png
ced0b7f36cf3b94b3751e459f2af460accebfca228e31ba26c0b0333f5ba12e7 top-bomber--drink.png
ef656b7f1c4cd8873bfdba7e7ac728d6bf25dc0248f3fdc60cd56217263b0bdb top-bomber--examine.png
32b912abc0ef0cbaf03d3621551f193fcea922c01e4fe2b726e452fb9ef6fc14 top-bomber--sit.png
09098f812475e109a446a0ffa1f9fef252d72bb6f7b2e5575b28e0387ba24a75 top-bomber--celebrate.png
04b1d5c179c4d35eaaefa6f34d289e91f9ac02de3d05a8abdee0e51e8d501503 top-bomber--dress.png
5bb9cc1773261f7b853150c172ff1f6a1146385f88c0bf1d35a60f41fabd20d8 top-tee-plain--walk.png
6fe1be96b1972e38a3ec7ee0c721714a35ff73f689460945e6c31535226d14b0 top-tee-plain--greet.png
b560c0df7268a3fab52838f424ec934ac2150b1b5b664a1772af3e1d5a250850 top-tee-plain--drink.png
e9de505be31716481aa03a78cd2206b58cf2870d4068358a487e5244fec5bbff top-tee-plain--examine.png
5135df43cd522c316d212abc0d4719be4d6eda5ea276115ca7868c64b7562f39 top-tee-plain--sit.png
8f7dde0fc8e6060c85211b19ac3d1cca080e4ac95e46f0939ecfbf0df61f171a top-tee-plain--celebrate.png
46504f39d3aece22e34a43324cfd789c77bf6aa7e133dcda0c63f3662f617f10 top-tee-plain--dress.png
fe67aa8ef026d4464b50f6dd24e7716545ac7fcf7acbfce19d6e0b25035619e3 top-tee-striped--walk.png
f8dafc077fecd66eab6c7888726195b61535bf8c23745305373a64fd62603440 top-tee-striped--greet.png
3562569fea3d07089e303057c0e11e96ab339df3b6ffa06c239e646efbe326dc top-tee-striped--drink.png
352d7a0f0d7f536ed8b513337f79b6edd830889cc000ef3f53fddd47a215de9a top-tee-striped--examine.png
c7190384d5478d9b4e17613d87dd9ecb8d51ce34ac0198b4ff2095352b2a34ec top-tee-striped--sit.png
277d9bbc71fcbe66fca9a06856b7bfec1a1d1151aed438d90d1f124f87488de4 top-tee-striped--celebrate.png
20386f79ae6e47a7be30a1f49ac30cfc001df18322266951e291caa7eadb77b8 top-tee-striped--dress.png
8ca6c23bfd4c05d40d4b5d4fc99fdfe9ebc94a896ed618a39bca5de7ed2fb950 top-shirt-blue--walk.png
1f400ffa06a454aaef517ffaa599af5eca01426b47db648b5c014fe1d3ff8933 top-shirt-blue--greet.png
a55f4a64ac961608f2b677fd0758527a7aade9984a61e153a8f1e9386d2dfe01 top-shirt-blue--drink.png
0017e226bcfd4c8a885d9f81c1212094d88975e3abb86e8a22440ba0b18197d7 top-shirt-blue--examine.png
0366fc88378f485ca38ebe3e4ae0981470f0319d121d911ad4e3c16f4ddb29fa top-shirt-blue--sit.png
85e6f476b9223922ae13e3863e57203009e8b99e97d6c19fb9f2a3c0885448e5 top-shirt-blue--celebrate.png
a190c74afc845ded1a62a4114c168445300f2216f191db2f0f23a2b08818b689 top-shirt-blue--dress.png
bc840d41d00318d050dcca6ad1cb72b919eedd770cef293ba98477267ae9cc0c top-cardigan-rust--walk.png
dc8e1228efda8800a12665bf3eac6ae1088c07a8e55ad82c268dc911c5eccb9d top-cardigan-rust--greet.png
abe61cc866b254b12b9748b31359eaade2237c0ecee1cfc73c3d602e2655daf7 top-cardigan-rust--drink.png
b0a0cb1568be171724732f2262ef2bc59b8540f3c5df8d877475cb060e5c6c9f top-cardigan-rust--examine.png
0811f17c760a8a4b0a3aacdd0b55b0dd2110f9c6cd30fe3a1da731db7fb1231a top-cardigan-rust--sit.png
52e2a8e35a915c4cd8082f23808d77f654b4cd6b4b6745a0c7a328a7689b6aa5 top-cardigan-rust--celebrate.png
087e0c02381b8bc4b19f200eed7c52cb50ba2edeb81649db1a4b92e0b4b6558a top-cardigan-rust--dress.png
4d55f8d8824c735206b2d8eb1c129cd1d137b4cdae35bd5ce40887c9e96fea3b top-hoodie-lavender--walk.png
8dfabffe9234310b34ecf267eefd72e18fc138d7bcbb53c7557490ec49df3bcd top-hoodie-lavender--greet.png
ccb826094893d712e27ed7e8b429e8c985fbe5661673fa68a68833ecce4c5498 top-hoodie-lavender--drink.png
ed7ad08c909c30dd045e28ce4ea043251d37eb3b8cf7a8a865a3b121e8a425a3 top-hoodie-lavender--examine.png
9409e4436a24cba734693d6a6652be9bed0135d074d20bd7e70726398e8b307e top-hoodie-lavender--sit.png
743c538987f834197ffe6a8d2195315223d24d9a9c83180641f65ef5d118a858 top-hoodie-lavender--celebrate.png
88f3f1b4c2df640aa2b267f4ac2ee9aefa62610e41db4b33c5ff0c0500ba5969 top-hoodie-lavender--dress.png
84fe245146b4f1821fba69d8569bd822979cadbad6567785affd0884f14aee53 top-vest-moss--walk.png
1aee80fbd7efe805973468502353fe7e3d86678009eb592f7a5937ec540e42a8 top-vest-moss--greet.png
72596f4be99c146050ffe2b9449e4015e2ba07a6c7a25a87429b964a67a2a7fb top-vest-moss--drink.png
32e5a7dbe9e601511d247dd76a36952e7d886f6010897f688b0fdc7ad2df4fb2 top-vest-moss--examine.png
09fc6011aec25e376b91e5c8ce28d9a7d85f5e30d34b9534fd5adadbb596d101 top-vest-moss--sit.png
106b1c710e1323d92be03863101539afa7af1ee9862a5a5926993539d2f2476d top-vest-moss--celebrate.png
efe676c1d0ef9030d07cadae016e9bd8bad7e013c0dee1e319dd381519be401a top-vest-moss--dress.png
21815c8b105cb74fc444c8c7a292b08005a2ec3242ef2ee5866331b7afe2e3cf top-overall-denim--walk.png
ecc81eda116a952b42ffd04a43cf53f6358e6ab5f385b2cfe45742531b02cb2b top-overall-denim--greet.png
f4d760f6f03aa985541e83305730ee47b7b7d9b4b1b55cb6cbecbdf2456ca331 top-overall-denim--drink.png
3d511463866b31192e24644f8db1171125849c174d126885dab0d1376a810462 top-overall-denim--examine.png
190d9f91d855100fcb5ccf25e51ccb84d0e20e1f03397ba58fc70548503fbfa7 top-overall-denim--sit.png
bdf7d5608ec6e2e008c5aede9e7b9e28ec1ef86dc8c45cbf15a3742fe8ef3afc top-overall-denim--celebrate.png
15d443f6fbc40287bafb9c3e520e134b166be2e300e242fe2230f1fd1f79ce8e top-overall-denim--dress.png
```
