# Modular café map integration

Base: PR #4 (101 Avatar02 parts). This branch does not merge main or deploy the public Site.

## Scene and behavior
- Approved compact main concept02 is the layout/style reference: tall rectangular café, left bar/back shelf, two right-wall round tables, L-shaped lower bench and four equal-size round tables.
- 64 independent render objects from 29 separate lossless WebP sprites. Floor/sidewalk repeat as tiles. Furniture, cups, machines, walls, windows, pillars, door and sunlight remain separate. No complete-scene image is rendered.
- `public/assets/cafe-map/layout.json` is the one normalized-coordinate source for scene placement, foot-depth, collisions, spawn and touch anchors. Backend Python and isolated demo JavaScript read that same file.
- Old saved positions inside new furniture or disconnected space are safely relocated to the reachable spawn. Cosmetics, inventory, balances and account state remain unchanged.
- Plant touch walks to its floor anchor before invoking the existing quest rules. Door touch walks to its anchor and opens an explicit participation-end confirmation in store mode, or remote information otherwise. Movement itself grants no quest/stamp benefit.
- Static QR participation still does not prove physical attendance/purchase. Staff-only stamp accrual is unchanged.
- Map viewport is compact; wardrobe/quest lists keep scrolling. Hotspots are 44 CSS pixels. The map retains geometric aspect ratio and scales the avatar with the scene.

## Assets / rebuild
Runtime sprite total: 1,006,852 bytes (29 files, ~0.96 MiB), excluding existing Avatar02 atlases. Source production PNGs were ~17.4 MiB before the last additional architecture modules. Derivatives crop the declared alpha-content rectangle and resize to authored placement resolution; each object remains independent. `asset-provenance.json` records source hashes, rectangles and output sizes.

`python scripts/build-map-assets.py <authoring-directory>` requires Pillow and an authoring `layout.json` plus original PNGs. Authoring sources are separate production inputs, not a runtime requirement. The checked-in WebP/layout files run without that directory or Pillow. Rebuilding is not an image-generation step. Runtime rendering supports both derived images and non-destructive sourceRect SVG crops.

## Verified
`NODE_PATH=../first_web-runtime/node_modules bash scripts/test-all.sh`:
- 72 Python tests, including JS/Python collision parity, BFS anchor reachability and persisted guest migration.
- Existing API/client/demo, 101-part state preservation, compositor and DOM flow tests.
- Modular scene depth/hotspot/path validation, final manifest demo movement tests.
- 3,605 avatar atlases; all original 51 item metadata and 1,015 original PNG hashes preserved.
- DOM walking test now chooses a horizontal route from the actual manifest spawn rather than assuming the old map coordinates.

Actual cloud-browser local preview: final separate objects visibly loaded; corrected an object-fit mismatch discovered during inspection; door path → information modal → close; saved 101-part wardrobe → map roundtrip. Reload preserved the previous outfit. Browser viewport was desktop, not a physical phone or mobile emulation. CSS fit and screenshot inspection are not pixel-identical design certification.

## Limits
- Pixel texture/colors differ somewhat from the reference illustration, particularly the counter. Layout agreement is not a claim of exact pixel reproduction.
- Physical iOS/Android, mobile viewport emulation, prolonged performance and every depth crossing have not been visually tested.
- External production auth and operating credentials remain unconfigured; demo stays clearly labeled and isolated.
- Public Site remains unchanged. No merge/deploy or CI pass is implied by local tests.
