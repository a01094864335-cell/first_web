# Avatar02 game integration · 2026-11-19

This is a separate review branch, combining the game in PR #2 and the catalogue in PR #3. No main merge or public preview update is part of this checkpoint.

## Data and economics

`appearance.avatar02` stores `{selection: {slot: itemId}, lens}`. The real development API validates against the shipped manifest and persists only the cosmetic selection in SQLite. The isolated mock API applies the same slot/ID/lens contract to browser-local data. Existing currencies, inventory and legacy outfit keys are not deleted or repriced. The 51-part editor is free try-on, not an assumed live shop economy. A previous appearance without Avatar02 selection retains a documented approximate legacy-item visual fallback until a new selection is saved.

## Rendering

The game adapter `avatar-runtime.js` reuses the catalogue's layer plans, source frame mapping, hair/hat variants, hands/grip masks and glasses clipping. `/avatar02/viewer.js` has a small opt-out boot guard for game use; the standalone viewer remains usable. The nested package.json preserves the catalogue's CommonJS helper tests under the game's ESM package.

The map and wardrobe use the same saved selection. The editor separately holds an unsaved draft. Map motion controls are cosmetic only; they do not grant a quest, issue a stamp or imply an actual drink purchase. The idle entry is a fixed walk-source frame, not newly drawn animated idle.

## Serving and publication

Only manifest, viewer and the PNGs referenced by the manifest are added to the development HTTP allowlist. Source artwork, preview contact sheets, tools, runtime databases and account secrets are not served by this route. This branch does not copy them to the previously published Site.

Production account setup, live authentication, conversion economics and real-device review remain separate tasks. See REMAINING-WORK.md. Automated geometry and compositor tests do not establish all-permutation visual quality.

## Expansion to 101 parts · 2026-11-19

Synchronized actual source commit 97d5842929fa15ba5251c720200d9e311963dabb, retaining the game boot guard and package boundary. Exactly 50 new parts; baseline51 metadata and1,015 old PNG hashes unchanged. Offline mock whitelist is regenerated from the real manifest; the sync command refuses missing/out-of-scope PNGs. Existing saved selections retain their IDs/slots.

Added Korean search and slot filters with selected-item preservation, empty-result feedback and heartbeat focus preservation. New items use the actual manifest labels, not placeholders. The wardrobe offers a collapsed renderer diagnostics panel with image cache/failed/registered counts and a clearly theoretical RGBA estimate. No cache policy change.

Verification:66 Python tests, all client/demo/adapter/DOM tests,3,232 viewer plans and3,605 atlas checks pass. Actual CUA preview showed101 items, old saved outfit restored, new curtain hair/straw hat/sailor/tiered outfit selection, save/reload, front walk and left greet. This sampled browser pass is not exhaustive or physical-device QA. The preview did not expose the latest diagnostics UI despite reload/restart, so sustained browser cache counts and responsiveness measurements are **not verified**. Static upper bound for all3,605 320×320 RGBA atlases is1,408.20MiB if all decoded simultaneously, excluding GPU/frame caches/overhead; this is not observed memory use and initial loading is selective. Long-session cache eviction remains a follow-up if measured demand warrants it.
