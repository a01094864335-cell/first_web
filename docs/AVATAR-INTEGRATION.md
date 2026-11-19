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
