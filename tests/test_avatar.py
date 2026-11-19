import json
import re
import sys
import unittest
import urllib.request
import urllib.error
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server as s
import avatar_catalogue as avatars
import test_server
import test_http

class AvatarTest(unittest.TestCase):
    setUp=test_server.CafeTest.setUp
    tearDown=test_server.CafeTest.tearDown
    act=test_server.CafeTest.act

    def test_all_manifest_parts_free_tryon(self):
        self.assertEqual(len(avatars.manifest()['items']),51)
        for item in avatars.manifest()['items']:
            payload={'selection':{item['slot']:item['id']},'lens':'blue'}
            result=self.act('/api/avatar',payload)
            self.assertEqual(result['user']['appearance']['avatar02'],payload)
            self.assertEqual(result['user']['coins'],0)
            self.assertEqual(result['user']['stamps'],0)
            self.assertFalse(any(i['owned'] for i in result['items']))

    def test_invalid_slot_item_lens_rejected_atomically(self):
        valid={'selection':{'hair':'hair-short','eyes':'eyes-dot'},'lens':'green'}
        self.act('/api/avatar',valid)
        for payload in ({'selection':{'hair':'hat-bucket'}}, {'selection':{'unknown':'hair-short'}}, {'selection':{'hair':'../../secret'}}, {'selection':[]}, {'selection':None}, {'lens':None}, {'lens':'red'}, {'selection':{'hair':['hair-short']}}, {'coins':999}):
            with self.assertRaises(s.APIError):self.act('/api/avatar',payload)
        with s.transaction() as c:self.assertEqual(s.state(c,'a')['user']['appearance']['avatar02'],valid)

    def test_default_and_removal(self):
        with s.transaction() as c:self.assertNotIn('avatar02',s.state(c,'a')['user']['appearance'])
        result=self.act('/api/avatar',{'selection':{'hair':None,'hat':''},'lens':'charcoal'})
        self.assertEqual(result['user']['appearance']['avatar02'],avatars.default_avatar())

    def test_appearance_legacy_fields_and_inventory_preserved(self):
        with s.transaction() as c:
            c.execute('UPDATE users SET appearance=?,linked=1 WHERE id=?',(json.dumps({'color':'#123456','custom':'retained'}),'a'))
            c.execute("INSERT INTO inventory VALUES('a','item0',1)")
        self.act('/api/avatar',{'selection':{'top':'top-hoodie-lavender'},'lens':'green'})
        with s.transaction() as c:
            u=s.state(c,'a')['user'];self.assertEqual(u['appearance']['color'],'#123456');self.assertEqual(u['appearance']['custom'],'retained');self.assertEqual(u['appearance']['equipped'],['item0']);self.assertEqual(u['linked'],1)

    def test_remote_public_projection_and_privacy(self):
        payload={'selection':{'hair':'hair-long-straight','glasses':'glasses-round'},'lens':'blue'}
        self.act('/api/avatar',payload)
        with s.transaction() as c:self.assertEqual(s.state(c,'b')['guests'],[])
        self.act('/api/privacy',{'visible':True})
        with s.transaction() as c:
            g=s.state(c,'b')['guests'][0];self.assertEqual(g['mode'],'remote');self.assertEqual(g['appearance']['avatar02'],payload);self.assertNotIn('coins',g)
        self.act('/api/block',{'id':'b'})
        with s.transaction() as c:self.assertEqual(s.state(c,'b')['guests'],[])

    def test_demo_manifest_whitelist_parity(self):
        source=(s.ROOT/'demo-api.js').read_text()
        items=json.loads(re.search(r'const AVATAR02_ITEMS = (\{.*?\});',source,re.S).group(1))
        lenses=json.loads(re.search(r'const AVATAR02_LENSES = (\[.*?\]);',source,re.S).group(1))
        self.assertEqual(items,{i['id']:i['slot'] for i in avatars.manifest()['items']})
        self.assertEqual(lenses,avatars.manifest()['lensColors'])

class AvatarHTTPTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):test_http.HTTPTest.setUpClass.__func__(cls)
    @classmethod
    def tearDownClass(cls):test_http.HTTPTest.tearDownClass.__func__(cls)
    setUp=test_http.HTTPTest.setUp
    call=test_http.HTTPTest.call

    def test_persist_restore_and_no_cross_user_update(self):
        self.assertEqual(self.call('/api/avatar',{'selection':{},'lens':'blue'})[0],401)
        self.call('/api/guest',{'nickname':'avatar','appearance':{'color':'#234567'}})
        payload={'selection':{'hand':'hand-camera','hat':'hat-beret'},'lens':'green'}
        self.assertEqual(self.call('/api/avatar',payload)[0],200)
        self.assertEqual(self.call('/api/state')[1]['user']['appearance']['avatar02'],payload)
        self.assertEqual(self.call('/api/avatar',{'selection':{'skin':'hat-bucket'}})[0],400)

    def test_guest_avatar_validation(self):
        code,_=self.call('/api/guest',{'nickname':'bad','appearance':{'avatar02':{'lens':'red'}}})
        self.assertEqual(code,400);self.assertIsNone(self.call('/api/state')[1]['user'])
        payload={'selection':{'skin':'skin-deep','eyes':'eyes-smile'},'lens':'blue'}
        code,result=self.call('/api/guest',{'nickname':'valid','appearance':{'avatar02':payload}})
        self.assertEqual(code,200);self.assertEqual(result['user']['appearance']['avatar02'],payload)

    def test_avatar_static_allowlist(self):
        good=['/avatar-runtime.js','/avatar02/manifest.json','/avatar02/viewer.js','/avatar02/preview.html','/avatar02/assets/walk/base.png']
        bad=['/avatar02/QA-SUMMARY.md','/avatar02/QA-full-audit-matrix.json','/avatar02/test-viewer.mjs','/avatar02/assets/','/avatar02/assets/not-in-manifest.png','/avatar02/%2e%2e/server.py','/avatar02/%252e%252e/server.py','/avatar02/previews/greet-combinations.gif']
        for path in good:
            for method in ('GET','HEAD'):
                with self.client.open(urllib.request.Request(self.url+path,method=method)) as r:self.assertEqual(r.status,200);r.read()
        for path in bad:
            for method in ('GET','HEAD'):
                with self.assertRaises(urllib.error.HTTPError) as e:self.client.open(urllib.request.Request(self.url+path,method=method))
                self.assertEqual(e.exception.code,404)
