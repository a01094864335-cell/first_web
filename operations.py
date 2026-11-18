"""Audited café operations. Caller must hold a SQLite write transaction.

No credentials, role assignment, or authentication shortcuts are supplied here.
The HTTP layer owns authentication and request idempotency. All authorization is
rechecked against persisted users on every call, not the submitted payload.
"""
import secrets
import sqlite3
import time


class OpsError(Exception):
    def __init__(self, message, status=400):
        self.message = message
        self.status = status
        super().__init__(message)


def init_schema(c):
    # Individual statements preserve the caller's existing transaction.
    for sql in (
        '''CREATE TABLE IF NOT EXISTS operation_transactions(
            ledger_id TEXT PRIMARY KEY, actor TEXT NOT NULL, kind TEXT NOT NULL,
            source_ref TEXT, original_id TEXT, created REAL NOT NULL)''',
        '''CREATE UNIQUE INDEX IF NOT EXISTS operation_source_unique
            ON operation_transactions(kind,source_ref) WHERE source_ref IS NOT NULL''',
        '''CREATE TABLE IF NOT EXISTS purchase_approvals(
            order_ref TEXT PRIMARY KEY, uid TEXT NOT NULL, qid TEXT NOT NULL,
            cycle TEXT NOT NULL, actor TEXT NOT NULL, created REAL NOT NULL,
            UNIQUE(uid,qid,cycle))''',
        '''CREATE TABLE IF NOT EXISTS profile_restrictions(
            uid TEXT PRIMARY KEY, actor TEXT NOT NULL, reason TEXT NOT NULL, created REAL NOT NULL)''',
        '''CREATE TABLE IF NOT EXISTS report_resolutions(
            report_id TEXT PRIMARY KEY, actor TEXT NOT NULL, outcome TEXT NOT NULL,
            reason TEXT NOT NULL, created REAL NOT NULL)''',
    ):
        c.execute(sql)


def _actor(c, actor_uid, admin=False):
    row = c.execute('SELECT id,role,linked FROM users WHERE id=?', (actor_uid,)).fetchone()
    if not row or not row['linked'] or row['role'] not in ('staff', 'admin'):
        raise OpsError('연결된 직원 계정의 권한이 필요해요', 403)
    if admin and row['role'] != 'admin':
        raise OpsError('관리자 권한이 필요해요', 403)
    return row


def _text(data, key, limit=300):
    value = data.get(key)
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > limit:
        raise OpsError(f'{key} 값을 확인해주세요')
    return value.strip()


def _amount(data, signed=False):
    value = data.get('amount')
    if type(value) is not int or value == 0 or abs(value) > 100000 or (not signed and value < 1):
        raise OpsError('올바른 조정 수량을 입력해주세요')
    return value


def _target(c, uid, linked=False):
    row = c.execute('SELECT id,nickname,linked FROM users WHERE id=?', (uid,)).fetchone()
    if not row:
        raise OpsError('손님을 찾을 수 없어요', 404)
    if linked and not row['linked']:
        raise OpsError('카카오 연결 손님에게만 스탬프를 적립할 수 있어요')
    return row


def _audit(c, actor, action, target, reason):
    ident = secrets.token_hex(12)
    c.execute('INSERT INTO audit VALUES(?,?,?,?,?,?)',
              (ident, actor, action, target, reason, time.time()))
    return ident


def _change(c, uid, currency, amount, reason, related=None):
    if currency not in ('coins', 'stamps'):
        raise OpsError('잘못된 재화예요')
    changed = c.execute(
        f'UPDATE users SET {currency}={currency}+? WHERE id=? AND {currency}+?>=0',
        (amount, uid, amount)).rowcount
    if not changed:
        raise OpsError('잔액이 부족해 자동 처리할 수 없어요. 관리자가 관련 사용 내역을 확인해야 해요', 409)
    ident = secrets.token_hex(12)
    c.execute('INSERT INTO ledger VALUES(?,?,?,?,?,?,?)',
              (ident, uid, currency, amount, reason, time.time(), related))
    return ident


def _record(c, ledger_id, actor, kind, source_ref=None, original_id=None):
    c.execute('INSERT INTO operation_transactions VALUES(?,?,?,?,?,?)',
              (ledger_id, actor, kind, source_ref, original_id, time.time()))


def can_publish(c, uid):
    return not c.execute('SELECT 1 FROM profile_restrictions WHERE uid=?', (uid,)).fetchone()


def dashboard(c, actor_uid):
    actor = _actor(c, actor_uid)
    result = {
        'pending': [dict(r) for r in c.execute('''SELECT q.uid,q.qid,q.cycle,q.status,q.reward,
            u.nickname FROM quests q JOIN users u ON u.id=q.uid
            WHERE q.status='pending' ORDER BY q.cycle,q.uid LIMIT 100''')],
        'recentGrants': [dict(r) for r in c.execute('''SELECT l.id,l.uid,l.amount,l.reason,l.created,
            o.actor,o.kind FROM ledger l JOIN operation_transactions o ON o.ledger_id=l.id
            WHERE o.kind='grant' AND (?='admin' OR o.actor=?) ORDER BY l.created DESC LIMIT 100''',
            (actor['role'], actor_uid))],
    }
    if actor['role'] == 'admin':
        result['reports'] = [dict(r) for r in c.execute('''SELECT r.id,r.uid,r.target,r.reason,r.created
            FROM reports r LEFT JOIN report_resolutions x ON x.report_id=r.id
            WHERE x.report_id IS NULL ORDER BY r.created LIMIT 100''')]
        result['audit'] = [dict(r) for r in c.execute('SELECT * FROM audit ORDER BY created DESC LIMIT 100')]
    return result


def dispatch(c, actor_uid, path, data):
    """Return a receipt; changes, ledger and audit remain in caller's transaction.

    Routes: /api/staff/{grant,reverse,restore,coin-adjust,approve,end,hide,resolve}.
    Grant requires a unique source_ref (order item ID or paper transfer reference).
    Approval requires order_ref unique across all purchase quest approvals.
    """
    actor = _actor(c, actor_uid)
    if not isinstance(data, dict):
        raise OpsError('잘못된 요청이에요')
    reason = _text(data, 'reason')
    operation = path.removeprefix('/api/staff/')
    if path != '/api/staff/' + operation:
        raise OpsError('지원하지 않는 운영 작업이에요', 404)
    now = time.time()
    result = {'operation': operation, 'created': now}

    if operation == 'grant':
        uid = _text(data, 'uid', 100)
        _target(c, uid, linked=True)
        amount = _amount(data)
        if amount > 100:
            raise OpsError('한 번에 적립할 수량은 100개 이하예요')
        source = _text(data, 'source_ref', 100)
        if c.execute("SELECT 1 FROM operation_transactions WHERE kind='grant' AND source_ref=?", (source,)).fetchone():
            raise OpsError('이미 적립한 주문 또는 이전 건이에요', 409)
        ident = _change(c, uid, 'stamps', amount, reason)
        _record(c, ident, actor_uid, 'grant', source_ref=source)
        result.update(ledgerId=ident, uid=uid, amount=amount)

    elif operation in ('reverse', 'restore'):
        original_id = _text(data, 'original_id', 100)
        original = c.execute('SELECT * FROM ledger WHERE id=?', (original_id,)).fetchone()
        if not original:
            raise OpsError('원거래를 찾을 수 없어요', 404)
        if operation == 'reverse':
            grant = c.execute("SELECT * FROM operation_transactions WHERE ledger_id=? AND kind='grant'", (original_id,)).fetchone()
            if not grant or original['currency'] != 'stamps' or original['amount'] <= 0:
                raise OpsError('직원이 적립한 원거래만 취소할 수 있어요')
            if actor['role'] != 'admin' and grant['actor'] != actor_uid:
                raise OpsError('직원은 본인의 적립만 취소할 수 있어요', 403)
            sign = -1
        else:
            _actor(c, actor_uid, admin=True)
            # Existing server's redemption ledger has this immutable reason.
            if original['currency'] != 'stamps' or original['amount'] != -10 or original['reason'] != '무료 음료 사용':
                raise OpsError('무료 음료 사용 원거래만 복원할 수 있어요')
            sign = 1
        amount = _amount(data)
        total = c.execute('''SELECT COALESCE(SUM(ABS(l.amount)),0) FROM ledger l
            JOIN operation_transactions o ON o.ledger_id=l.id
            WHERE o.original_id=? AND o.kind=?''', (original_id, operation)).fetchone()[0]
        if total + amount > abs(original['amount']):
            raise OpsError('원거래의 남은 조정 수량을 초과했어요', 409)
        ident = _change(c, original['uid'], original['currency'], sign * amount, reason, original_id)
        _record(c, ident, actor_uid, operation, original_id=original_id)
        result.update(ledgerId=ident, uid=original['uid'], amount=sign * amount, originalId=original_id)

    elif operation == 'coin-adjust':
        _actor(c, actor_uid, admin=True)
        uid = _text(data, 'uid', 100)
        _target(c, uid)
        amount = _amount(data, signed=True)
        ident = _change(c, uid, 'coins', amount, reason)
        _record(c, ident, actor_uid, 'coin-adjust')
        result.update(ledgerId=ident, uid=uid, amount=amount)

    elif operation == 'approve':
        uid = _text(data, 'uid', 100)
        qid = data.get('qid', 'menu')
        if not isinstance(qid, str) or not qid:
            raise OpsError('퀘스트를 확인해주세요')
        cycle = _text(data, 'cycle', 100)
        decision = data.get('approve')
        if type(decision) is not bool:
            raise OpsError('승인 여부를 선택해주세요')
        pending = c.execute("SELECT * FROM quests WHERE uid=? AND qid=? AND cycle=? AND status='pending'", (uid,qid,cycle)).fetchone()
        if not pending:
            raise OpsError('승인 대기 건이 없어요', 409)
        if decision:
            order = _text(data, 'order_ref', 100)
            if c.execute('SELECT 1 FROM purchase_approvals WHERE order_ref=?', (order,)).fetchone():
                raise OpsError('이미 퀘스트에 사용한 주문 항목이에요', 409)
            c.execute('INSERT INTO purchase_approvals VALUES(?,?,?,?,?,?)', (order,uid,qid,cycle,actor_uid,now))
        status = 'complete' if decision else 'rejected'
        c.execute('UPDATE quests SET status=?,value=? WHERE uid=? AND qid=? AND cycle=?', (status,reason,uid,qid,cycle))
        result.update(uid=uid, qid=qid, cycle=cycle, status=status)

    elif operation in ('end', 'hide', 'unhide'):
        _actor(c, actor_uid, admin=True)
        uid = _text(data, 'uid', 100)
        _target(c, uid)
        if operation == 'end':
            c.execute("UPDATE sessions SET mode='remote',visible=0,expires=0,drink='',activity='' WHERE uid=?", (uid,))
        elif operation == 'hide':
            c.execute("UPDATE sessions SET visible=0,drink='',activity='' WHERE uid=?", (uid,))
            c.execute('INSERT OR REPLACE INTO profile_restrictions VALUES(?,?,?,?)', (uid,actor_uid,reason,now))
        else:
            c.execute('DELETE FROM profile_restrictions WHERE uid=?', (uid,))
        result['uid'] = uid

    elif operation == 'resolve':
        _actor(c, actor_uid, admin=True)
        report = _text(data, 'report_id', 100)
        outcome = data.get('outcome')
        if outcome not in ('reviewed', 'hidden', 'dismissed'):
            raise OpsError('처리 결과를 선택해주세요')
        row = c.execute('SELECT * FROM reports WHERE id=?', (report,)).fetchone()
        if not row:
            raise OpsError('신고를 찾을 수 없어요', 404)
        if c.execute('SELECT 1 FROM report_resolutions WHERE report_id=?', (report,)).fetchone():
            raise OpsError('이미 처리한 신고예요', 409)
        if outcome == 'hidden':
            c.execute("UPDATE sessions SET visible=0,drink='',activity='' WHERE uid=?", (row['target'],))
            c.execute('INSERT OR REPLACE INTO profile_restrictions VALUES(?,?,?,?)', (row['target'],actor_uid,reason,now))
        c.execute('INSERT INTO report_resolutions VALUES(?,?,?,?,?)', (report,actor_uid,outcome,reason,now))
        result.update(uid=row['target'], reportId=report, outcome=outcome)
    else:
        raise OpsError('지원하지 않는 운영 작업이에요', 404)

    result['auditId'] = _audit(c, actor_uid, path, result.get('uid', ''), reason)
    return result
