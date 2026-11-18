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
- Stamp redemption server rule is implemented but unavailable to guests. Real staff QR scanning, paper transfer UI, reversal/adjustment workflow and live receipt validation remain unfinished.
- Conversion stays disabled until the user decides the real ratio; no assumed real benefit is issued.
- Staff content/version/season scheduling, moderation console, business closing schedule, cumulative quest, linked-order deduplication and analytics remain unfinished.
- Polling refresh is not a load-tested production realtime service. Offline transaction recovery UX, per-connection foreground tracking, rate limiting, hardened deployment, backups, retention/deletion and restore drills remain launch work.
- Pixel assets are first-pass prototypes, not a guaranteed exact pixel-grid match. Bench has faint edge glow. Seats do not reserve real café places.

Do not treat the café QR as proof of physical location or purchase. No GPS is collected. Cash, POS or real beverage redemption has not been connected.

## Checks

`tests/test_server.py` covers server rules, race claims, balances, privacy, expiry and denied operations. Browser flow checks and their actual outcomes belong in `docs/IMPLEMENTATION.md`. No production credentials or runtime DB should be committed.
