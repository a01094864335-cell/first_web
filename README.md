# Cafe Quest · The Credit

Server-backed development implementation of the approved café concept. **Not production-ready or deployed.** The original greeting page has been replaced; the unrelated Saju source and design PR are untouched.

## Run

Python 3.10+ (no Python dependencies):

```sh
python server.py
# http://127.0.0.1:8000
# Café paper QR entry: http://127.0.0.1:8000/?entry=cafe
python -m unittest discover -s tests -v
```

Guest progress and transactions live in SQLite `data/cafe.sqlite3`, not localStorage. Keep this file when restarting. For isolated tests, set `CAFE_DB`. `PORT`, `HOST` and `CAFE_SECURE_COOKIE=1` are available. The cookie must be Secure behind HTTPS in a hosted environment. Never expose this development server directly to the Internet.

## Implemented

- Guest creation/recovery through hashed, HttpOnly session cookie and SQLite.
- QR participation versus remote participation; default private; explicit 90-minute extension/checkout; server-side expiry; remote inactivity auto-hide.
- Simplified responsive map, server collision validation, public guest projections, mutual blocking/report capture.
- Daily visit, exploration, mood and purchase-approval quest lifecycle. Completed rewards survive the cycle. KST 04:00 cycle boundary.
- Atomic coin rewards, ten catalogue items, ownership, purchases and one item per equipment slot.
- Idempotency keys for transactions, serialized SQLite write transactions, nonnegative balance constraints.
- Separate stamp ledger and protected staff approval/grant routes. Guest cannot become staff through UI/query parameters.
- Real generated background/furniture assets, converted to WebP. Current character rendering is a development representation, not final approved animation sheets.

## Explicitly not complete

The PRD demands full connected functionality; this implementation does **not** claim that goal is complete.

- Kakao OAuth, existing-account guest merge/recovery, staff allowlist setup, logout/deletion and final policy text remain to be implemented and integration-tested. No fake authentication path exists.
- Stamp redemption server rule is implemented but unavailable to guests. Real staff QR scanning, paper-card handling and live receipt validation remain unfinished; audited reversal/adjustment API and forms are now implemented.
- Conversion stays disabled until the user decides the real ratio; no assumed real benefit is issued.
- Automatic business-hours scheduling and analytics remain unfinished; content versions/schedules, basic moderation console, cumulative quests and linked-order deduplication are now implemented.
- Polling refresh is not a load-tested production realtime service. Durable offline recovery across browser restart, per-connection foreground tracking, hardened deployment and retention/deletion remain launch work. Basic retry handling, request limits and consistent backup utility are implemented.
- Pixel assets are first-pass prototypes, not a guaranteed exact pixel-grid match. Bench has faint edge glow. Seats do not reserve real café places.

Do not treat the café QR as proof of physical location or purchase. No GPS is collected. Cash, POS or real beverage redemption has not been connected.

## Checks

`tests/test_server.py` covers server rules, race claims, balances, privacy, expiry and denied operations. Browser flow checks and their actual outcomes belong in `docs/IMPLEMENTATION.md`. No production credentials or runtime DB should be committed.

## Second implementation checkpoint

Additional server-backed features now available:
- Nickname changes, blocked-user management, explicit guest logout with recovery warning.
- Separate stamp/coin histories and idempotent redemption receipt replay.
- Authenticated staff/admin operations: grants keyed by source reference, own-grant reversals, admin bounded redemption restoration and coin adjustments, unique-order purchase approval, profile restrictions and report resolution, audit dashboard.
- Versioned item/quest content with scheduled availability and snapshot rewards for accepted quests; monthly three-distinct-day QR participation reward.
- Administrator closing/reopening participation; closing ends active store sessions and hides profiles.
- Request limits, security response headers, local consistent SQLite backup utility.

These operator and stamp operations have automated tests with isolated synthetic accounts. They are **not available to real operators until Kakao and the operator allowlist are integrated**. No production role assignment shortcut exists. Conversion remains disabled.

Backup: `python scripts/backup.py /secure/local/path/cafe-backup.sqlite3` creates a new backup with an integrity check, refuses existing destinations and public paths. No automatic deletion or retention policy is assumed. Never commit or publicly share real database backups.

## Isolated demonstration mode

Open `http://127.0.0.1:8000/?demo=1` after starting the server. The persistent **데모 · 실제 계정/스탬프와 무관** banner identifies this mode. It uses only the browser's `cafe-quest-demo-v1` storage and never calls the production `/api` endpoints. The existing server-backed mode remains at `/`.

The demo tools let you switch guest/customer/staff/admin, advance time, reset, simulate Kakao new/existing-account merge/restoration, approve purchase quests, grant/reverse stamps, redeem, and demonstrate account deletion. The local QR encodes a `DEMO:` identifier, not real account authority. Conversion is **sample-only 1 stamp : 50 coins**; this does not decide the real rate or enable production conversion. No real login, beverage entitlement, stamp issuance, camera scanning or deletion occurs.

Original approved character and motion sheets are available in the wardrobe's design preview. They load only on demand. They are opaque concept contact sheets, not individual runtime sprites; the map still uses development characters.

### Additional checks

```sh
node scripts/test-client.cjs
node scripts/test-demo.cjs
npm ci
npm run test:dom
```

The DOM suite checks actual UI handlers against the mock module, including onboarding, reward, purchase/equipment, mock linking, operator grant, redemption and conversion, while rejecting all live fetch calls. jsdom is **not** a visual browser: this does not validate pixel layout, iOS Safari, camera access or real authentication.
