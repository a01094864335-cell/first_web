# Implementation checkpoint · 2026-11-18

## Status

Working server-backed **development foundation**, not fulfillment of all PRD v0.4 acceptance criteria. No deployed production environment, real Kakao or real stamp issuance is claimed.

The approved simplified café concept takes precedence over PRD's older green-lounge visuals. Nine WebP assets total about 328 KB, converted from the generated prototype kit. Same round-table file reused six times. Characters are CSS placeholders pending animation/sprite preparation.

## Verification

- `python -m unittest discover -s tests -v`: 56 tests pass (including static-QR boundary regression checks).
- `node --check script.js`: passes.
- Python compilation: passes.
- Includes concurrent reward claims (20 calls, one credit), transaction-key replay (10 HTTP retries, one credit), purchase balances, expiry, remote restrictions, mutual block and privacy projection.
- Browser smoke script prepared in `scripts/smoke.cjs`. Chromium failed to launch in this executor with `socket() failed: Operation not permitted`, including permission retry. No screenshot or visual/browser pass is claimed.
- Actual iOS Safari and Android Chrome remain untested.

## Before rollout

1. Complete Kakao OAuth callback and once-only guest merge; configure real app and operator allowlist without exposing secrets.
2. Validate operator/content/moderation screens in a real browser and complete QR scanning and operational paper-card handling. Core adjustment, scheduling, cumulative-quest and moderation logic now has tests.
3. Decide conversion economics and privacy/retention policy. Conversion remains disabled meanwhile.
4. Integrate final character sprites, align furniture and interaction anchors using real device visual QA.
5. Production-test the initial rate limits, security headers, retry handling and backup tools; finalize session lifetimes and operational restore procedures, then move from development HTTP server to supported production hosting.
6. Load-test presence, use per-device heartbeat semantics and authoritative movement timelines rather than final-position polling.

`CAFE_ENTRY_CODE` configures the paper QR value (`?entry=...`). Development default is `cafe`; it is not a physical presence or purchase proof. Shared QR URLs remain usable outside the store as accepted in the PRD.

## Second checkpoint

Expanded scope (not a production release):
- Versioned content scheduling/availability and accepted-quest snapshots; sold-out inventory remains owned/equippable.
- Monthly unique QR participation and previously pending purchase approval visibility.
- Audited, role-bound stamp grants/reversal/restoration; unique source/order records; nonnegative balances.
- Durable profile hiding, report review, admin close/reopen participation.
- Nickname/block management/logout, redemption receipts, retry-safe transaction keys.
- Backup/restore-read test, security headers, per-IP request throttling.

Remaining: real Kakao OAuth and one-time guest merge, account deletion/retention policy, real QR display/scanning, production identity/role provisioning, automatic business-hours schedule, character animations, real-time movement timeline, cross-device transaction recovery (reload-safe retry metadata is now stored per browser tab), conversion economics, real-device visual/performance QA and production deployment. Basic operator/content screens require browser validation; tests are not a substitute.


Second-checkpoint independent review found and fixed: content JSON/boolean presentation, accepted quest type/date snapshots, displayed-vs-claimed reward cycle, protected automatic quest IDs, plus resumed-request keys and paused-progress UI. Python regression coverage includes these server cases. Browser QA is still not a pass.


### Static paper QR boundary
The fixed QR URL can intentionally be saved/shared and reused outside the café. The entry value selects a participation mode; it is not secret authentication, GPS evidence, a rotating token, or proof of purchase. Check-in and quests issue digital coins only. Stamp grants still require a separately authenticated, allowlisted staff actor and a linked customer plus an audited source reference. Three regression checks explicitly preserve these distinctions.

## Isolated mock mode requested by the user

`?demo=1` now completes the external-integration flows using explicitly fictitious data. Real API/DB code remains unchanged in purpose. The mock module never calls live endpoints, including when module loading fails. Persistent page/modal notices, demo-only role tools and separate storage prevent confusing the demo with real Kakao/stamp operations.

Mock coverage includes new/existing-account linkage and once-only merge, recovery, separate balances and QR identifier, sample conversion, redemption receipt, operator actions, content scheduling, expiry, deletion and reset. A local QR image encodes only the demo identifier. Real camera scanning is not implemented; the operator form uses the displayed identifier.

Validation: existing 56 Python tests still pass; client retry and demo API suites pass; jsdom handler integration passes guest→QR→reward→purchase/equip→mock link→operator grant→redemption→sample conversion with zero live fetch calls. Browser rendering/real-device QC remains unverified due the previously recorded execution limitation.

## Avatar integration checkpoint · 2026-11-19

Replaced CSS placeholders with the real 51-part Avatar02 layer compositor on a separate review branch. Server and isolated mock selection persistence are implemented, with legacy data preserved. See AVATAR-INTEGRATION.md and REMAINING-WORK.md for the exact free-try-on boundary.

Final automated suite: 65 Python tests; client retry; mock API; avatar mock contracts; adapter structural/double tests; extended DOM workflows; viewer helper tests; 1,015 atlas checks passed. Browser preview is now available through the supported Sites preview service. CUA verified onboarding, one outfit across wardrobe/map/reload, front walk and rear greet. Actual iOS/Android and exhaustive combinations remain untested. No main merge or public preview update.
