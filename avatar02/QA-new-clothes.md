# Five-item clothing extension QA

Source/art: five distinct image_gen outputs, 4 directional cells each, all 20 visually inspected. Clothing-only and transparent; no source hands/body pixels observed. Kept under source/new_clothes, specs are builder-compatible and route with fit=new_clothes.

Items: top-raglan, top-turtleneck, top-bomber, bottom-skirt-pleated, bottom-trousers-cargo.

Actual runtime-format assets generated: five items × seven actions =35 RGBA320x320 atlases, four direction rows × four frames. Shared 80x80 cells. QA uses actual render_proofs renderer with warm skin, short hair and sneakers; tops combined with existing shorts, bottoms combined with mint tee.

Inspected all seven action sheets for every item as five item-wide montages: walk/greet/drink/examine/sit/celebrate/dress ×4 directions×4 frames =560 displayed combinations. Proofs: previews/new-clothes/*.jpg. Additionally enlarged bare-body detail checks: cargo sit all16, turtleneck celebrate all16, bomber greet all16.

Observed:
- Raglan blue diagonal shoulder/collar treatment distinct from old striped/plain tee; remains inside baseline neck/shoulder/hem and posed sleeves.
- Mustard ribbed turtleneck and dark-green bomber preserve distinct generated collar, ribbing, zipper and hem detail. Raised arm color follows baseline; no embedded source hand.
- Purple pleats remain visible; seated skirt folds into compact lap silhouette with no standing long box covering feet.
- Cargo flap-pockets are source crops, not prior generic seam pixels. They follow current leg region; inspected side sit remains on thigh/hip and does not cover bent shoes. Pocket extends at most one pixel from leg as intended pouch silhouette.

Scope limitations: this is one representative outfit per item, not every combinatorial outfit or browser animation. Pleat compression and cuffs are simplified at tiny resolution; no claim of bespoke per-frame cloth simulation. Parent's final combined build/proof regeneration should be checked for routing regressions. Existing helpers not modified; only new source, specs, fit_expansion_clothes.py, five generated item atlases and proofs were created by this assignment.

## Foot clearance follow-up

Independent thumbnail review raised possible skirt/shoe and cargo/shoe overlap. Enlarged inspection corrected the stronger claim: baseline gray feet were already visible in the cited original frames. This was not proven complete-foot occlusion. Added a conservative clearance safeguard anyway: detect gray foot interior in baseline bottom10px, expand one pixel for outline, and clear new bottom overlays there. Standing pleated skirt is moved upward2px as a whole so the hem keeps its shape rather than being cut into shoe-shaped notches. Seated lap placement remains unchanged; cargo pocket artwork remains present. Initial two-pixel dilation was reduced to one pixel to avoid excessive garment trimming.

Before/after enlarged comparisons inspected for skirt front/back walkf1, side walkf0, side sitf1, cargo right sitf1/left sitf2. Saved outside repo as avatar-expansion-feet-before-after.png. Earlier assertion that no possible shoe overlap existed was too broad; corrected to observed foot clearance in reviewed frames. Final helper and assets regenerated after this safeguard; no source regeneration.

Final classification: foot-clearance change is a readability polish, not a fix for proven missing feet. Parent independently viewed before/after and adopted one-pixel safety plus two-pixel standing-hem lift. Helper frozen for final combined build.
