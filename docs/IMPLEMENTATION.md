# Implementation checkpoint · 2026-11-18

## Status

Working server-backed **development foundation**, not fulfillment of all PRD v0.4 acceptance criteria. No deployed production environment, real Kakao or real stamp issuance is claimed.

The approved simplified café concept takes precedence over PRD's older green-lounge visuals. Nine WebP assets total about 328 KB, converted from the generated prototype kit. Same round-table file reused six times. Characters are CSS placeholders pending animation/sprite preparation.

## Verification

- `python -m unittest discover -s tests -v`: 53 tests pass (second checkpoint).
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
