# Implementation checkpoint · 2026-11-18

## Status

Working server-backed **development foundation**, not fulfillment of all PRD v0.4 acceptance criteria. No deployed production environment, real Kakao or real stamp issuance is claimed.

The approved simplified café concept takes precedence over PRD's older green-lounge visuals. Nine WebP assets total about 328 KB, converted from the generated prototype kit. Same round-table file reused six times. Characters are CSS placeholders pending animation/sprite preparation.

## Verification

- `python -m unittest discover -s tests -v`: 24 tests pass.
- `node --check script.js`: passes.
- Python compilation: passes.
- Includes concurrent reward claims (20 calls, one credit), transaction-key replay (10 HTTP retries, one credit), purchase balances, expiry, remote restrictions, mutual block and privacy projection.
- Browser smoke script prepared in `scripts/smoke.cjs`. Chromium failed to launch in this executor with `socket() failed: Operation not permitted`, including permission retry. No screenshot or visual/browser pass is claimed.
- Actual iOS Safari and Android Chrome remain untested.

## Before rollout

1. Complete Kakao OAuth callback and once-only guest merge; configure real app and operator allowlist without exposing secrets.
2. Finish operator console, QR scan and stamp reversal/adjustment records, content scheduling/versioning, cumulative quests and moderation.
3. Decide conversion economics and privacy/retention policy. Conversion remains disabled meanwhile.
4. Integrate final character sprites, align furniture and interaction anchors using real device visual QA.
5. Harden rate limits, session lifetimes, CSRF/deployment headers, request replay/recovery, backups and restore; move from development HTTP server to supported production hosting.
6. Load-test presence, use per-device heartbeat semantics and authoritative movement timelines rather than final-position polling.

`CAFE_ENTRY_CODE` configures the paper QR value (`?entry=...`). Development default is `cafe`; it is not a physical presence or purchase proof. Shared QR URLs remain usable outside the store as accepted in the PRD.
