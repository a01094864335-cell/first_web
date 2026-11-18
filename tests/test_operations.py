import concurrent.futures
import sys
import tempfile
import time
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server
import operations as ops


class OperationsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        server.DB = self.tmp.name + '/test.db'
        server.init_db()
        with server.transaction() as c:
            ops.init_schema(c)
            for uid,role,linked in [('admin','admin',1),('staff','staff',1),('other','staff',1),('customer','guest',1),('guest','guest',0)]:
                c.execute('INSERT INTO users(id,token,nickname,appearance,role,linked) VALUES(?,?,?,?,?,?)', (uid,uid,uid,'{}',role,linked))
                c.execute('INSERT INTO sessions(uid,active) VALUES(?,?)', (uid,time.time()))

    def tearDown(self):
        self.tmp.cleanup()

    def call(self, action, data=None, actor='staff'):
        data = {'reason':'test reason', **(data or {})}
        with server.transaction() as c:
            return ops.dispatch(c, actor, '/api/staff/'+action, data)

    def grant(self, amount=10, actor='staff', source='order1'):
        return self.call('grant', {'uid':'customer','amount':amount,'source_ref':source},actor)

    def balance(self,currency='stamps'):
        with server.transaction() as c:
            return c.execute(f'SELECT {currency} FROM users WHERE id="customer"').fetchone()[0]

    def test_guest_and_unlinked_staff_denied(self):
        with self.assertRaises(ops.OpsError):
            self.call('grant', {'uid':'customer','amount':1,'source_ref':'x'},'guest')
        with server.transaction() as c:c.execute("UPDATE users SET linked=0 WHERE id='staff'")
        with self.assertRaises(ops.OpsError):self.grant()

    def test_grant_link_required_and_duplicate_source(self):
        with self.assertRaises(ops.OpsError):self.call('grant',{'uid':'guest','amount':1,'source_ref':'x'})
        self.grant()
        with self.assertRaises(ops.OpsError):self.grant()
        self.assertEqual(self.balance(),10)

    def test_reversal_is_bounded_and_audited(self):
        grant=self.grant()
        self.call('reverse',{'original_id':grant['ledgerId'],'amount':6})
        self.call('reverse',{'original_id':grant['ledgerId'],'amount':4})
        with self.assertRaises(ops.OpsError):self.call('reverse',{'original_id':grant['ledgerId'],'amount':1})
        self.assertEqual(self.balance(),0)
        with server.transaction() as c:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM audit').fetchone()[0],3)
            self.assertEqual(c.execute('SELECT COUNT(*) FROM ledger WHERE related=?',(grant['ledgerId'],)).fetchone()[0],2)

    def test_staff_cannot_reverse_another_staff_grant(self):
        grant=self.grant()
        with self.assertRaises(ops.OpsError):self.call('reverse',{'original_id':grant['ledgerId'],'amount':1},'other')
        self.call('reverse',{'original_id':grant['ledgerId'],'amount':1},'admin')

    def test_spent_grant_never_negative(self):
        grant=self.grant()
        with server.transaction() as c:server.change(c,'customer','stamps',-10,'무료 음료 사용')
        with self.assertRaises(ops.OpsError):self.call('reverse',{'original_id':grant['ledgerId'],'amount':10})
        self.assertEqual(self.balance(),0)

    def test_restore_admin_only_and_bounded(self):
        self.grant()
        with server.transaction() as c:ident=server.change(c,'customer','stamps',-10,'무료 음료 사용')
        with self.assertRaises(ops.OpsError):self.call('restore',{'original_id':ident,'amount':10})
        self.call('restore',{'original_id':ident,'amount':4},'admin')
        self.call('restore',{'original_id':ident,'amount':6},'admin')
        with self.assertRaises(ops.OpsError):self.call('restore',{'original_id':ident,'amount':1},'admin')
        self.assertEqual(self.balance(),10)

    def test_coin_adjust_admin_only(self):
        with self.assertRaises(ops.OpsError):self.call('coin-adjust',{'uid':'customer','amount':3})
        self.call('coin-adjust',{'uid':'customer','amount':3},'admin')
        with self.assertRaises(ops.OpsError):self.call('coin-adjust',{'uid':'customer','amount':-4},'admin')
        self.assertEqual(self.balance('coins'),3)

    def test_approval_deduplicates_order_and_allows_old_cycle(self):
        with server.transaction() as c:
            for uid in ('customer','guest'):
                c.execute("INSERT INTO quests(uid,qid,cycle,status,reward) VALUES(?,'menu','2000-01-01','pending',25)",(uid,))
        self.call('approve',{'uid':'customer','cycle':'2000-01-01','approve':True,'order_ref':'order:item1'})
        with self.assertRaises(ops.OpsError):self.call('approve',{'uid':'guest','cycle':'2000-01-01','approve':True,'order_ref':'order:item1'})
        with server.transaction() as c:self.assertEqual(c.execute("SELECT status FROM quests WHERE uid='guest'").fetchone()[0],'pending')

    def test_concurrent_reverse_does_not_exceed_original(self):
        grant=self.grant(5)
        def reverse(_):
            try:self.call('reverse',{'original_id':grant['ledgerId'],'amount':1});return 1
            except ops.OpsError:return 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:self.assertEqual(sum(pool.map(reverse,range(20))),5)
        self.assertEqual(self.balance(),0)

    def test_dashboard_role_scope(self):
        self.grant(actor='other')
        with server.transaction() as c:
            self.assertEqual(ops.dashboard(c,'staff')['recentGrants'],[])
            self.assertNotIn('audit',ops.dashboard(c,'staff'))
            self.assertEqual(len(ops.dashboard(c,'admin')['recentGrants']),1)
            with self.assertRaises(ops.OpsError):ops.dashboard(c,'customer')

    def test_moderation_requires_admin_and_reason(self):
        with self.assertRaises(ops.OpsError):self.call('end',{'uid':'customer'})
        with self.assertRaises(ops.OpsError):self.call('end',{'uid':'customer','reason':''},'admin')
        with server.transaction() as c:c.execute("UPDATE sessions SET visible=1,mode='store' WHERE uid='customer'")
        self.call('end',{'uid':'customer'},'admin')
        with server.transaction() as c:
            r=c.execute("SELECT mode,visible FROM sessions WHERE uid='customer'").fetchone();self.assertEqual(tuple(r),('remote',0))

    def test_profile_restriction_persists_until_admin_unhide(self):
        self.call('hide',{'uid':'customer'},'admin')
        with server.transaction() as c:self.assertFalse(ops.can_publish(c,'customer'))
        with self.assertRaises(ops.OpsError):self.call('unhide',{'uid':'customer'})
        self.call('unhide',{'uid':'customer'},'admin')
        with server.transaction() as c:self.assertTrue(ops.can_publish(c,'customer'))

    def test_report_resolution_once(self):
        with server.transaction() as c:c.execute('INSERT INTO reports VALUES(?,?,?,?,?)',('report1','guest','customer','test',time.time()))
        self.call('resolve',{'report_id':'report1','outcome':'dismissed'},'admin')
        with self.assertRaises(ops.OpsError):self.call('resolve',{'report_id':'report1','outcome':'dismissed'},'admin')

if __name__ == '__main__':unittest.main()
