import sys,time,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import test_server
import unittest
import server as s
import catalogue
class ContentTest(unittest.TestCase):
 tearDown=test_server.CafeTest.tearDown
 act=test_server.CafeTest.act
 def setUp(self):
  test_server.CafeTest.setUp(self)
  with s.transaction() as c:c.execute("UPDATE users SET role='admin',linked=1 WHERE id='b'")
 def edit(self,kind,id,body,**kwargs):
  return self.act('/api/staff/content',{'kind':kind,'id':id,'body':body,'reason':'테스트',**kwargs},uid='b')
 def test_snapshots_not_retroactive(self):
  self.act('/api/checkin',{'entry':'cafe'});self.act('/api/quest',{'id':'mood','action':'start'})
  self.edit('quest','mood',{'title':'새 이름','description':'새 내용','reward':500,'kind':'mood'})
  self.act('/api/quest',{'id':'mood','action':'progress','value':'happy'})
  result=self.act('/api/quest',{'id':'mood','action':'claim'})
  self.assertEqual(result['user']['coins'],10)
 def test_scheduled_content(self):
  self.edit('quest','later',{'title':'다음 주','description':'나중에','reward':5,'kind':'mood'},starts=time.time()+3600)
  self.act('/api/checkin',{'entry':'cafe'})
  with self.assertRaises(s.APIError):self.act('/api/quest',{'id':'later','action':'start'})
 def test_sale_stop_keeps_inventory(self):
  with s.transaction() as c:s.change(c,'a','coins',100,'test')
  self.act('/api/buy',{'id':'item0'})
  self.edit('item','item0',{'name':'모자','price':100,'slot':'hat'},enabled=False)
  result=self.act('/api/equip',{'id':'item0'})
  self.assertTrue(next(i for i in result['items'] if i['id']=='item0')['equipped'])
 def test_monthly_visits_unique(self):
  with s.transaction() as c:
   for d in (s.day()[:7]+'-00',s.day()[:7]+'-99'):c.execute('INSERT INTO visits VALUES(?,?)',('a',d))
  self.act('/api/checkin',{'entry':'cafe'})
  self.act('/api/quest',{'id':'monthly','action':'claim'})
  self.act('/api/checkin',{'entry':'cafe'})
  with self.assertRaises(s.APIError):self.act('/api/quest',{'id':'monthly','action':'claim'})
 def test_business_close(self):
  self.act('/api/checkin',{'entry':'cafe'});self.act('/api/privacy',{'visible':True})
  self.act('/api/staff/business',{'closed':True,'reason':'마감'},uid='b')
  with s.transaction() as c:
   state=s.state(c,'a');self.assertEqual(state['session']['mode'],'remote');self.assertFalse(state['session']['visible'])
  with self.assertRaises(s.APIError):self.act('/api/checkin',{'entry':'cafe'})
 def test_logout_invalidates(self):
  self.assertIsNone(self.act('/api/logout')['user'])
  with s.transaction() as c:self.assertNotEqual(c.execute("SELECT token FROM users WHERE id='a'").fetchone()['token'],'a')
 def test_guest_cannot_auto_progress(self):
  self.act('/api/checkin',{'entry':'cafe'})
  with self.assertRaises(s.APIError):self.act('/api/quest',{'id':'monthly','action':'progress'})
 def test_pending_visible_next_day(self):
  with s.transaction() as c:c.execute("INSERT INTO quests(uid,qid,cycle,status,reward) VALUES('a','menu','2000-01-01','pending',25)")
  with s.transaction() as c:self.assertEqual(next(q for q in s.state(c,'a')['quests'] if q['id']=='menu')['status'],'pending')

 def test_claim_matches_displayed_oldest_reward(self):
  with s.transaction() as c:
   c.execute("INSERT INTO quests(uid,qid,cycle,status,reward) VALUES('a','plant','2000-01-01','complete',15)")
   c.execute("INSERT INTO quests(uid,qid,cycle,status,reward) VALUES('a','plant','2000-01-02','complete',100)")
   displayed=next(q for q in s.state(c,'a')['quests'] if q['id']=='plant')['reward']
  self.assertEqual(self.act('/api/quest',{'id':'plant','action':'claim'})['user']['coins'],displayed)
 def test_reserved_quest_not_editable(self):
  with self.assertRaises(s.APIError):self.edit('quest','visit',{'title':'changed','description':'changed','reward':999,'kind':'mood'})
 def test_dashboard_content_shape(self):
  self.edit('item','item0',{'name':'모자','price':30,'slot':'hat'},enabled=False)
  with s.transaction() as c:
   row=catalogue.version(c,'item','item0')
   self.assertIsInstance(row['body'],dict);self.assertIs(row['enabled'],False)
 def test_active_kind_is_snapshot(self):
  self.act('/api/checkin',{'entry':'cafe'});self.act('/api/quest',{'id':'mood','action':'start'})
  self.edit('quest','mood',{'title':'new','description':'new','reward':100,'kind':'purchase'},starts=time.time()+3600)
  with s.transaction() as c:
   q=next(q for q in s.state(c,'a')['quests'] if q['id']=='mood')
   self.assertEqual(q['kind'],'mood');self.assertTrue(q['available'])
  self.act('/api/quest',{'id':'mood','action':'progress','value':'happy'})
