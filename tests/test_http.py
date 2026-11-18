import json, tempfile, threading, unittest, urllib.request, urllib.error, http.cookiejar, os, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server as s
class HTTPTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory();s.DB=cls.tmp.name+'/db';s.init_db();cls.http=s.ThreadingHTTPServer(('127.0.0.1',0),s.Handler)
  cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start();cls.url=f'http://127.0.0.1:{cls.http.server_port}'
 @classmethod
 def tearDownClass(cls):cls.http.shutdown();cls.http.server_close();cls.tmp.cleanup()
 def setUp(self):self.client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def call(self,path,data=None,key=None,origin=None):
  headers={'Content-Type':'application/json'}
  if key:headers['Idempotency-Key']=key
  if origin:headers['Origin']=origin
  req=urllib.request.Request(self.url+path,json.dumps(data).encode() if data is not None else None,headers)
  try:
   with self.client.open(req) as r:return r.status,json.load(r)
  except urllib.error.HTTPError as e:return e.code,json.load(e)
 def test_private_files_denied(self):
  for path in ('/server.py','/public/assets/%2e%2e/%2e%2e/server.py','/data/cafe.sqlite3'):
   for method in ('GET','HEAD'):
    req=urllib.request.Request(self.url+path,method=method)
    with self.assertRaises(urllib.error.HTTPError) as ctx:self.client.open(req)
    self.assertEqual(ctx.exception.code,404)
 def test_auth(self):self.assertEqual(self.call('/api/checkin',{'entry':'cafe'})[0],401)
 def test_idempotency_restore(self):
  self.call('/api/guest',{'nickname':'테스터'});self.call('/api/checkin',{'entry':'cafe'})
  for _ in range(10):
   status,data=self.call('/api/quest',{'id':'visit','action':'claim'},'same-request');self.assertEqual(status,200);self.assertEqual(data['user']['coins'],20)
  self.assertEqual(self.call('/api/buy',{'id':'item3'},'same-request')[0],409)
  self.assertEqual(self.call('/api/buy',{'id':'item3'})[0],400)
  self.assertEqual(self.call('/api/buy',{'id':'item3'},'purchase')[1]['user']['coins'],0)
 def test_origin(self):self.assertEqual(self.call('/api/guest',{'nickname':'x'},origin='https://evil.example')[0],403)
 def test_restore(self):
  a=self.call('/api/guest',{'nickname':'restore'})[1];b=self.call('/api/state')[1];self.assertEqual(a['user']['id'],b['user']['id'])
 def test_invalid_json_shape(self):self.assertEqual(self.call('/api/guest',[])[0],400)
if __name__=='__main__':unittest.main()
