import concurrent.futures, tempfile, unittest, sys, time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server as s
class CafeTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();s.DB=self.tmp.name+'/test.db';s.init_db()
  with s.transaction() as c:
   for uid in ('a','b'):
    c.execute('INSERT INTO users(id,token,nickname,appearance) VALUES(?,?,?,?)',(uid,uid,uid,'{}'));c.execute('INSERT INTO sessions(uid,active) VALUES(?,?)',(uid,time.time()))
 def tearDown(self):self.tmp.cleanup()
 def act(self,path,data={},uid='a'):
  with s.transaction() as c:return s.act(c,uid,path,data)
 def test_remote_cannot_progress(self):
  with self.assertRaises(s.APIError):self.act('/api/quest',{'id':'plant','action':'progress','value':'plant'})
 def test_daily_visit_once_and_remote_claim(self):
  self.act('/api/checkin',{'entry':'cafe'});self.act('/api/checkout');self.act('/api/quest',{'id':'visit','action':'claim'});self.act('/api/checkin',{'entry':'cafe'})
  with self.assertRaises(s.APIError):self.act('/api/quest',{'id':'visit','action':'claim'})
  with s.transaction() as c:self.assertEqual(s.state(c,'a')['user']['coins'],20)
 def test_parallel_claims(self):
  self.act('/api/checkin',{'entry':'cafe'})
  def claim(_):
   try:self.act('/api/quest',{'id':'visit','action':'claim'});return True
   except s.APIError:return False
  with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:self.assertEqual(sum(pool.map(claim,range(20))),1)
 def test_purchase_atomic(self):
  with s.transaction() as c:s.change(c,'a','coins',30,'test')
  self.act('/api/buy',{'id':'item0'})
  with self.assertRaises(s.APIError):self.act('/api/buy',{'id':'item1'})
  with s.transaction() as c:self.assertEqual(s.state(c,'a')['user']['coins'],0)
 def test_equip_owned_only(self):
  with self.assertRaises(s.APIError):self.act('/api/equip',{'id':'item0'})
 def test_expiry_privacy(self):
  self.act('/api/checkin',{'entry':'cafe'});self.act('/api/privacy',{'visible':True,'drink':'coffee'})
  with s.transaction() as c:
   c.execute('UPDATE sessions SET expires=1 WHERE uid="a"');state=s.state(c,'a');self.assertEqual(state['session']['mode'],'remote');self.assertFalse(state['session']['visible']);self.assertEqual(state['session']['drink'],'')
 def test_remote_inactivity(self):
  self.act('/api/privacy',{'visible':True})
  with s.transaction() as c:
   c.execute('UPDATE sessions SET active=1 WHERE uid="a"');self.assertFalse(s.state(c,'a')['session']['visible'])
 def test_mutual_block(self):
  self.act('/api/privacy',{'visible':True});self.act('/api/privacy',{'visible':True},uid='b')
  self.act('/api/block',{'id':'b'})
  with s.transaction() as c:
   self.assertEqual(s.state(c,'a')['guests'],[]);self.assertEqual(s.state(c,'b')['guests'],[])
 def test_guest_projection(self):
  self.act('/api/privacy',{'visible':True,'activity':'reading'})
  with s.transaction() as c:
   guest=s.state(c,'b')['guests'][0];self.assertNotIn('coins',guest);self.assertNotIn('token',guest);self.assertNotIn('stamps',guest)
 def test_checkin_requires_qr(self):
  with self.assertRaises(s.APIError):self.act('/api/checkin')
 def test_path_avoids_furniture(self):
  result=self.act('/api/move',{'x':.5,'y':.2})
  self.assertTrue(result['path'])
  self.assertTrue(all(not s.blocked(p['x'],p['y']) for p in result['path']))
 def test_equipment_shared(self):
  with s.transaction() as c:s.change(c,'a','coins',30,'test')
  self.act('/api/buy',{'id':'item3'});self.act('/api/equip',{'id':'item3'});self.act('/api/privacy',{'visible':True})
  with s.transaction() as c:self.assertEqual(s.state(c,'b')['guests'][0]['appearance']['equipped'],['item3'])
 def test_wall_collision(self):
  with self.assertRaises(s.APIError):self.act('/api/move',{'x':.1,'y':.2})
 def test_staff_denied(self):
  with self.assertRaises(s.APIError):self.act('/api/staff/grant',{'uid':'b','amount':10,'reason':'test'})
 def test_conversion_disabled(self):
  with self.assertRaises(s.APIError):self.act('/api/stamps/convert')
 def test_kst_day(self):
  self.assertEqual(s.day(1794938400),s.day(1794938400+60))
 def test_claim_previous_cycle(self):
  with s.transaction() as c:c.execute("INSERT INTO quests(uid,qid,cycle,status,reward) VALUES('a','plant','2000-01-01','complete',15)")
  self.assertEqual(self.act('/api/quest',{'id':'plant','action':'claim'})['user']['coins'],15)
 def test_store_not_hidden_at_five_minutes(self):
  self.act('/api/checkin',{'entry':'cafe'});self.act('/api/privacy',{'visible':True})
  with s.transaction() as c:
   c.execute('UPDATE sessions SET active=1 WHERE uid="a"');self.assertTrue(s.state(c,'a')['session']['visible'])
 def test_static_qr_reuse_without_location_evidence(self):
  first=self.act('/api/checkin',{'entry':'cafe'})
  self.assertEqual(first['session']['mode'],'store')
  self.act('/api/checkout')
  second=self.act('/api/checkin',{'entry':'cafe'})
  self.assertEqual(second['session']['mode'],'store')
  # Neither call submits GPS, a rotating challenge, or purchase proof.
 def test_qr_and_quest_never_grant_stamps(self):
  with s.transaction() as c:c.execute("UPDATE users SET linked=1 WHERE id='a'")
  self.act('/api/checkin',{'entry':'cafe'})
  result=self.act('/api/quest',{'id':'visit','action':'claim'})
  self.assertGreater(result['user']['coins'],0);self.assertEqual(result['user']['stamps'],0)
 def test_linked_store_customer_cannot_grant_stamps(self):
  with s.transaction() as c:c.execute("UPDATE users SET linked=1 WHERE id='a'")
  self.act('/api/checkin',{'entry':'cafe'})
  with self.assertRaises(s.APIError):self.act('/api/staff/grant',{'uid':'a','amount':1,'source_ref':'order','reason':'purchase'})
if __name__=='__main__':unittest.main()
