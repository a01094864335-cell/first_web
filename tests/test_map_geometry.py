import unittest,json,subprocess
import map_geometry as m

class GeometryTests(unittest.TestCase):
 def fixture(self):
  return {'version':'test','canvas':{'width':600,'height':1000},'bounds':[.03,.08,.94,.88],'spawn':{'x':.5,'y':.7},'objects':[{'id':'table','asset':'table.png','x':.2,'y':.2,'width':.2,'height':.2,'depth':1,'collision':[.2,.2,.2,.2],'interaction':{'action':'table','label':'table','anchor':{'x':.5,'y':.4}}}]}
 def test_routes_and_collision(self):
  d=m.validate(self.fixture());p=m.route(d['spawn'],{'x':.1,'y':.3},d)
  self.assertTrue(all(not m.blocked(n['x'],n['y'],d) for n in p))
  for pos in ({'x':.3,'y':.3},{'x':-1,'y':2},{'x':None,'y':float('nan')}):self.assertEqual(m.normalize_position(pos,d),d['spawn'])
  self.assertEqual(m.normalize_position({'x':.55,'y':.7},d),{'x':.55,'y':.7})
 def test_unreachable_anchors_rejected(self):
  d=self.fixture();d['objects'][0]['interaction']['anchor']={'x':.3,'y':.3}
  with self.assertRaises(ValueError):m.validate(d)
 def test_disconnected_old_save_migrates(self):
  d=self.fixture();d['objects'][0]['collision']=[.03,.45,.94,.05];d['objects'][0]['interaction']=None
  self.assertEqual(m.normalize_position({'x':.5,'y':.3},d),d['spawn'])
 def test_js_python_parity(self):
  d=self.fixture();points=[{'x':x/100,'y':y/100} for x in range(0,101,5) for y in range(0,101,5)]
  code="import {blocked,normalizePosition,route,validateLayout} from './public/assets/cafe-map/map-geometry.js';let d="+json.dumps(d)+";validateLayout(d);let p="+json.dumps(points)+";console.log(JSON.stringify({blocked:p.map(p=>blocked(d,p.x,p.y)),normalized:p.map(p=>normalizePosition(d,p)),path:route(d,d.spawn,{x:.1,y:.3})}));"
  result=json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=m.LAYOUT_PATH.parents[3]))
  self.assertEqual(result['blocked'],[m.blocked(p['x'],p['y'],d) for p in points]);self.assertEqual(result['normalized'],[m.normalize_position(p,d) for p in points]);self.assertEqual(result['path'],m.route(d['spawn'],{'x':.1,'y':.3},d))
 def test_final_layout_interaction_paths(self):
  if not m.LAYOUT_PATH.exists():self.skipTest('Asset producer layout not present yet')
  d=m.layout()
  for o in d['objects']:
   if o.get('interaction'):self.assertTrue(m.route(d['spawn'],o['interaction']['anchor'],d))

class SavedPositionTests(unittest.TestCase):
 def test_authoritative_saved_position_and_public_projection(self):
  import server as server,tempfile,time
  from unittest.mock import patch
  d=GeometryTests().fixture();old_db=server.DB
  with tempfile.TemporaryDirectory() as tmp, patch.object(m,'layout',return_value=d),patch.object(m,'reachable_live',return_value=m.reachable(d)):
   server.DB=tmp+'/test.db';server.init_db()
   try:
    with server.transaction() as c:
     for uid in ('a','b'):
      c.execute('INSERT INTO users(id,token,nickname,appearance) VALUES(?,?,?,?)',(uid,uid,uid,'{}'))
      c.execute('INSERT INTO sessions(uid,active,x,y,visible) VALUES(?,?,?,?,1)',(uid,time.time(),.3,.3))
     result=server.state(c,'a')
     self.assertEqual({k:result['session'][k] for k in ('x','y')},d['spawn'])
     self.assertEqual({k:result['guests'][0][k] for k in ('x','y')},d['spawn'])
     saved=c.execute('SELECT x,y FROM sessions WHERE uid=?',('b',)).fetchone()
     self.assertEqual(tuple(saved),(d['spawn']['x'],d['spawn']['y']))
   finally:server.DB=old_db
