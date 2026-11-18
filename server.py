"""Cafe Quest development server. Standard-library only, SQLite authoritative state."""
import hashlib, json, os, secrets, sqlite3, time, math
import catalogue
import operations
import threading
from contextlib import contextmanager
from collections import deque
from datetime import datetime, timedelta, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT=Path(__file__).parent
RATE_LOCK=threading.Lock()
RATE={}
def rate_allowed(ip):
 now=time.time()
 with RATE_LOCK:
  for key in list(RATE):
   if RATE[key][0]<now-60:del RATE[key]
  window,count=RATE.get(ip,(now,0));RATE[ip]=(window,count+1)
  return count<180

DB=os.environ.get('CAFE_DB',str(ROOT/'data/cafe.sqlite3'))
ITEMS=[(f'item{i}',name,price,slot) for i,(name,price,slot) in enumerate([
 ('라벤더 모자',30,'hat'),('민트 모자',30,'hat'),('베이지 베레모',40,'hat'),('책 한 권',20,'prop'),('머그컵',20,'prop'),('작은 꽃',25,'prop'),('노란 셔츠',30,'outfit'),('초록 셔츠',30,'outfit'),('푸른 셔츠',30,'outfit'),('분홍 셔츠',30,'outfit')])]
QUESTS=[('visit','오늘의 카페 참여','QR로 참여한 영업일마다 한 번',20,'visit'),('plant','새 화분 찾기','카페의 화분을 찾아 눌러보세요',15,'explore'),('mood','오늘의 기분','오늘의 기분을 골라주세요. 공개되지 않아요',10,'mood'),('menu','추천 메뉴 맛보기','직원의 구매 확인을 기다려주세요',25,'purchase')]
# Normalized room coordinates. Coordinates are shared with browser pathfinding.
OBSTACLES=[(.04,.13,.28,.52),(.06,.76,.12,.16),(.06,.88,.48,.07),(.70,.30,.16,.09),(.70,.56,.16,.09),(.18,.77,.12,.07),(.18,.88,.12,.07),(.35,.88,.12,.07),(.52,.88,.12,.07)]

def day(now=None):
 return (datetime.fromtimestamp(now or time.time(),timezone(timedelta(hours=9)))-timedelta(hours=4)).strftime('%Y-%m-%d')
def blocked(x,y):
 return not (.03<=x<=.97 and .08<=y<=.96) or any(a-.015<=x<=a+w+.015 and b-.015<=y<=b+h+.015 for a,b,w,h in OBSTACLES)
def init_db():
 Path(DB).parent.mkdir(parents=True,exist_ok=True)
 with sqlite3.connect(DB) as c:
  c.executescript('''PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, token TEXT UNIQUE, nickname TEXT, appearance TEXT, coins INTEGER DEFAULT 0 CHECK(coins>=0), stamps INTEGER DEFAULT 0 CHECK(stamps>=0), linked INTEGER DEFAULT 0, role TEXT DEFAULT 'guest');
CREATE TABLE IF NOT EXISTS sessions(uid TEXT PRIMARY KEY,mode TEXT DEFAULT 'remote',expires REAL DEFAULT 0,visible INTEGER DEFAULT 0,x REAL DEFAULT .5,y REAL DEFAULT .7,activity TEXT DEFAULT '',drink TEXT DEFAULT '',active REAL DEFAULT 0);
CREATE TABLE IF NOT EXISTS quests(uid TEXT,qid TEXT,cycle TEXT,status TEXT,value TEXT DEFAULT '',reward INTEGER,PRIMARY KEY(uid,qid,cycle));
CREATE TABLE IF NOT EXISTS inventory(uid TEXT,item TEXT,equipped INTEGER DEFAULT 0,PRIMARY KEY(uid,item));
CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,uid TEXT,currency TEXT,amount INTEGER,reason TEXT,created REAL,related TEXT);
CREATE TABLE IF NOT EXISTS requests(uid TEXT,key TEXT,body TEXT,response TEXT,PRIMARY KEY(uid,key));
CREATE TABLE IF NOT EXISTS blocks(uid TEXT,target TEXT,PRIMARY KEY(uid,target));
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,uid TEXT,target TEXT,reason TEXT,created REAL);
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,actor TEXT,action TEXT,target TEXT,reason TEXT,created REAL);
''')
  catalogue.init_schema(c,ITEMS,QUESTS)
  operations.init_schema(c)
@contextmanager
def transaction():
 c=sqlite3.connect(DB,timeout=10); c.row_factory=sqlite3.Row
 try:
  c.execute('BEGIN IMMEDIATE'); yield c; c.commit()
 except: c.rollback(); raise
 finally:c.close()
class APIError(Exception):
 def __init__(self,message,status=400):self.message=message;self.status=status

def change(c,uid,currency,amount,reason,related=None):
 if currency not in ('coins','stamps'):raise APIError('잘못된 재화')
 if c.execute(f'UPDATE users SET {currency}={currency}+? WHERE id=? AND {currency}+?>=0',(amount,uid,amount)).rowcount!=1:raise APIError('잔액이 부족해요')
 ident=secrets.token_hex(12)
 c.execute('INSERT INTO ledger VALUES(?,?,?,?,?,?,?)',(ident,uid,currency,amount,reason,time.time(),related)); return ident

def normalize(c,uid):
 s=c.execute('SELECT * FROM sessions WHERE uid=?',(uid,)).fetchone(); now=time.time()
 if not operations.can_publish(c,uid):c.execute('UPDATE sessions SET visible=0 WHERE uid=?',(uid,))
 if s['mode']=='store' and s['expires']<=now:
  c.execute("UPDATE sessions SET mode='remote',visible=0,drink='',activity='' WHERE uid=?",(uid,))
 elif s['mode']=='remote' and s['active']<now-300:
  c.execute('UPDATE sessions SET visible=0 WHERE uid=?',(uid,))

def state(c,uid):
 if not uid:return {'user':None,'config':{'kakaoEnabled':False,'conversionEnabled':False}}
 normalize(c,uid)
 u=dict(c.execute('SELECT id,nickname,appearance,coins,stamps,linked,role FROM users WHERE id=?',(uid,)).fetchone());u['appearance']=json.loads(u['appearance'])
 s=dict(c.execute('SELECT * FROM sessions WHERE uid=?',(uid,)).fetchone());s['expiresAt']=int(s.pop('expires')*1000);s.pop('uid');s.pop('active')
 qs=[]
 for definition in catalogue.latest(c,'quest'):
  q,title,desc,reward,kind=(definition[k] for k in ('id','title','description','reward','kind'))
  rows=c.execute('SELECT * FROM quests WHERE uid=? AND qid=? ORDER BY cycle DESC',(uid,q)).fetchall()
  row=next((r for r in reversed(rows) if r['status']=='complete'),None) or next((r for r in rows if r['status']=='pending'),None) or next((r for r in rows if r['cycle']==(day()[:7] if kind=='cumulative' else day())),None)
  old=catalogue.existing(c,uid,q,row['cycle']) if row else None
  if old:title,desc,kind=old['title'],old['description'],old['kind']
  effective=old or definition
  qs.append({'id':q,'title':title,'description':desc,'reward':row['reward'] if row else reward,'kind':kind,'status':row['status'] if row else ('available' if catalogue.available(definition) else 'unavailable'),'cycle':row['cycle'] if row else day(),'available':bool(definition['enabled']) and catalogue.available(effective),'starts':effective['starts'],'ends':effective['ends'],'note':row['value'] if row and row['status']=='rejected' else ''})
 inv={r['item']:r['equipped'] for r in c.execute('SELECT * FROM inventory WHERE uid=?',(uid,))}
 u['appearance']['equipped']=[i for i in inv if inv[i]]
 items=[{'id':i['id'],'name':i['name'],'price':i['price'],'slot':i['slot'],'owned':i['id'] in inv,'equipped':bool(inv.get(i['id'])),'available':catalogue.available(i)} for i in catalogue.latest(c,'item') if catalogue.available(i) or i['id'] in inv]
 guests=[]
 for row in c.execute('SELECT u.id,u.nickname,u.appearance,s.* FROM users u JOIN sessions s ON s.uid=u.id WHERE u.id!=? AND s.visible=1',(uid,)).fetchall():
  normalize(c,row['id'])
  ss=c.execute('SELECT visible FROM sessions WHERE uid=?',(row['id'],)).fetchone()
  if not ss['visible'] or c.execute('SELECT 1 FROM blocks WHERE (uid=? AND target=?) OR (uid=? AND target=?)',(uid,row['id'],row['id'],uid)).fetchone():continue
  appearance=json.loads(row['appearance']);appearance['equipped']=[r['item'] for r in c.execute('SELECT item FROM inventory WHERE uid=? AND equipped=1',(row['id'],))]
  guests.append({k:row[k] for k in ('id','nickname','mode','x','y','activity','drink')}|{'appearance':appearance})
 ledger=[dict(r) for r in c.execute('SELECT id,currency,amount,reason,created FROM ledger WHERE uid=? ORDER BY created DESC LIMIT 100',(uid,))]
 return {'user':u,'session':s,'quests':qs,'items':items,'guests':guests,'ledger':ledger,'config':{'conversionEnabled':False,'kakaoEnabled':False,'obstacles':OBSTACLES,'prototype':True}}

def act(c,uid,path,data):
 normalize(c,uid);s=c.execute('SELECT * FROM sessions WHERE uid=?',(uid,)).fetchone();u=c.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone();now=time.time()
 def store():
  if s['mode']!='store':raise APIError('매장 QR로 참여한 상태에서 이용할 수 있어요',403)
 def linked():
  if not u['linked']:raise APIError('카카오 계정 연결이 필요해요. 현재 인증 설정 준비 중이에요',403)
 def admin():
  if not u['linked'] or u['role']!='admin':raise APIError('관리자 권한이 필요해요',403)
 def staff():
  if u['role'] not in ('staff','admin'):raise APIError('직원 권한이 필요해요',403)
 if path=='/api/checkin':
  closed=c.execute("SELECT value FROM settings WHERE key='closed'").fetchone()
  if closed and closed['value']=='1':raise APIError('현재 카페 참여가 종료되었어요',409)
  if data.get('entry')!=os.environ.get('CAFE_ENTRY_CODE','cafe'):raise APIError('매장 QR 링크로 다시 참여해주세요',403)
  c.execute("UPDATE sessions SET mode='store',expires=?,visible=0,activity='',drink='',active=? WHERE uid=?",(now+5400,now,uid))
  c.execute("INSERT OR IGNORE INTO quests(uid,qid,cycle,status,reward) VALUES(?,'visit',?,'complete',20)",(uid,day()))
  c.execute('INSERT OR IGNORE INTO visits VALUES(?,?)',(uid,day()))
  count=c.execute('SELECT COUNT(*) FROM visits WHERE uid=? AND day LIKE ?',(uid,day()[:7]+'%')).fetchone()[0]
  if count>=3:c.execute("INSERT OR IGNORE INTO quests(uid,qid,cycle,status,reward) VALUES(?,'monthly',?,'complete',40)",(uid,day()[:7]))
 elif path=='/api/checkout':c.execute("UPDATE sessions SET mode='remote',visible=0,expires=0,activity='',drink='' WHERE uid=?",(uid,))
 elif path=='/api/extend':
  store();c.execute('UPDATE sessions SET expires=? WHERE uid=?',(now+5400,uid))
 elif path=='/api/heartbeat':
  if data.get('foreground') is True:c.execute('UPDATE sessions SET active=? WHERE uid=?',(now,uid))
 elif path=='/api/privacy':
  if data.get('visible') and not operations.can_publish(c,uid):raise APIError('운영자가 공개를 제한한 프로필이에요',403)
  activity=str(data.get('activity',''))[:30];drink=str(data.get('drink',''))[:40]
  c.execute('UPDATE sessions SET visible=?,activity=?,drink=?,active=? WHERE uid=?',(bool(data.get('visible')),activity,drink,now,uid))
 elif path=='/api/move':
  try:x,y=float(data['x']),float(data['y'])
  except (KeyError,ValueError,TypeError):raise APIError('올바른 위치가 아니에요')
  if not math.isfinite(x+y) or blocked(x,y):raise APIError('가구나 벽이 있는 곳은 이동할 수 없어요')
  # Grid path is computed server-side, never a straight teleport through furniture.
  scale=100; start=(round(s['x']*scale),round(s['y']*scale)); goal=(round(x*scale),round(y*scale))
  queue=deque([start]); parents={start:None}
  while queue and goal not in parents:
   cur=queue.popleft()
   for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
    nxt=(cur[0]+dx,cur[1]+dy)
    if nxt not in parents and not blocked(nxt[0]/scale,nxt[1]/scale):parents[nxt]=cur;queue.append(nxt)
  if goal not in parents:raise APIError('이곳으로 가는 길을 찾을 수 없어요')
  route=[];cur=goal
  while cur is not None:route.append({'x':cur[0]/scale,'y':cur[1]/scale});cur=parents[cur]
  route.reverse()
  c.execute('UPDATE sessions SET x=?,y=? WHERE uid=?',(goal[0]/scale,goal[1]/scale,uid))
  result=state(c,uid);result['path']=route;return result
 elif path=='/api/quest':
  definition=catalogue.version(c,'quest',data.get('id'))
  if not definition:raise APIError('없는 퀘스트예요',404)
  qid=definition['id'];action=data.get('action');cycle=day()[:7] if definition['kind']=='cumulative' else day()
  q=(qid,definition['title'],definition['description'],definition['reward'],definition['kind'])
  if action=='claim':
   row=c.execute("SELECT * FROM quests WHERE uid=? AND qid=? AND status='complete' ORDER BY cycle LIMIT 1",(uid,q[0])).fetchone()
   if not row:raise APIError('수령할 보상이 없어요')
   c.execute("UPDATE quests SET status='claimed' WHERE uid=? AND qid=? AND cycle=?",(uid,q[0],row['cycle']));change(c,uid,'coins',row['reward'],q[1])
  else:
   store()
   if q[4] in ('visit','cumulative'):raise APIError('방문 기록으로 자동 진행되는 퀘스트예요')
   current=catalogue.existing(c,uid,qid,cycle) or definition
   if not definition['enabled'] or not catalogue.available(current):raise APIError('지금은 참여할 수 없는 퀘스트예요',409)
   snapshot=catalogue.snapshot(c,uid,definition,cycle)
   q=(qid,snapshot['title'],snapshot['description'],snapshot['reward'],snapshot['kind'])
   c.execute("INSERT OR IGNORE INTO quests(uid,qid,cycle,status,reward) VALUES(?,?,?,'active',?)",(uid,q[0],cycle,q[3]))
   row=c.execute('SELECT * FROM quests WHERE uid=? AND qid=? AND cycle=?',(uid,q[0],cycle)).fetchone()
   if row['status'] in ('claimed','complete','pending'):raise APIError('이미 진행을 마친 퀘스트예요')
   if action=='progress':
    if q[4]=='explore' and data.get('value')!='plant':raise APIError('화분을 찾아 선택해주세요')
    if q[4]=='mood' and data.get('value') not in ('happy','calm','tired','focused'):raise APIError('기분을 선택해주세요')
    status='pending' if q[4]=='purchase' else 'complete'
    c.execute('UPDATE quests SET status=?,value=? WHERE uid=? AND qid=? AND cycle=?',(status,str(data.get('value',''))[:100],uid,q[0],cycle))
   elif action!='start':raise APIError('잘못된 동작이에요')
 elif path=='/api/buy':
  itemdata=catalogue.version(c,'item',data.get('id'))
  item=tuple(itemdata[k] for k in ('id','name','price','slot')) if itemdata else None
  if not item:raise APIError('없는 상품이에요')
  if not catalogue.available(itemdata):raise APIError('판매가 종료되었어요',409)
  if c.execute('SELECT 1 FROM inventory WHERE uid=? AND item=?',(uid,item[0])).fetchone():raise APIError('이미 보유한 아이템이에요')
  change(c,uid,'coins',-item[2],item[1]+' 구매');c.execute('INSERT INTO inventory VALUES(?,?,0)',(uid,item[0]))
 elif path=='/api/equip':
  itemdata=catalogue.version(c,'item',data.get('id'))
  item=tuple(itemdata[k] for k in ('id','name','price','slot')) if itemdata else None
  row=c.execute('SELECT * FROM inventory WHERE uid=? AND item=?',(uid,data.get('id'))).fetchone()
  if not item or not row:raise APIError('보유한 아이템만 착용할 수 있어요')
  for i in catalogue.latest(c,'item'):
   if i['slot']==item[3]:c.execute('UPDATE inventory SET equipped=0 WHERE uid=? AND item=?',(uid,i['id']))
  c.execute('UPDATE inventory SET equipped=? WHERE uid=? AND item=?',(not row['equipped'],uid,item[0]))
 elif path in ('/api/block','/api/report'):
  target=data.get('id')
  if target==uid or not c.execute('SELECT 1 FROM users WHERE id=?',(target,)).fetchone():raise APIError('손님을 찾을 수 없어요')
  if path.endswith('block'):c.execute('INSERT OR IGNORE INTO blocks VALUES(?,?)',(uid,target))
  else:
   reason=str(data.get('reason','')).strip()[:500]
   if not reason:raise APIError('신고 사유를 적어주세요')
   c.execute('INSERT INTO reports VALUES(?,?,?,?,?)',(secrets.token_hex(12),uid,target,reason,now))
 elif path=='/api/unblock':c.execute('DELETE FROM blocks WHERE uid=? AND target=?',(uid,data.get('id')))
 elif path=='/api/profile':
  name=str(data.get('nickname','')).strip()
  if not 1<=len(name)<=16:raise APIError('닉네임은 1~16글자로 입력해주세요')
  c.execute('UPDATE users SET nickname=? WHERE id=?',(name,uid))
 elif path=='/api/logout':
  c.execute("UPDATE users SET token=? WHERE id=?",(secrets.token_hex(32),uid))
  c.execute("UPDATE sessions SET mode='remote',visible=0,drink='',activity='',expires=0 WHERE uid=?",(uid,))
  return state(c,None)
 elif path=='/api/stamps/redeem':
  linked();store();ident=change(c,uid,'stamps',-10,'무료 음료 사용')
  result=state(c,uid);result['receipt']={'id':ident,'created':now,'amount':10};return result
 elif path=='/api/stamps/convert':raise APIError('전환 비율 확정 전에는 전환할 수 없어요',409)
 elif path=='/api/staff/content':
  admin();reason=str(data.get('reason','')).strip()[:300]
  if not reason:raise APIError('변경 사유가 필요해요')
  try:version=catalogue.edit(c,data.get('kind'),data)
  except (ValueError,KeyError) as e:raise APIError(str(e))
  c.execute('INSERT INTO audit VALUES(?,?,?,?,?,?)',(secrets.token_hex(12),uid,path,str(data.get('id')),reason,now))
 elif path=='/api/staff/business':
  admin();reason=str(data.get('reason','')).strip()[:300]
  if not reason or type(data.get('closed'))!=bool:raise APIError('상태와 사유를 확인해주세요')
  c.execute('INSERT OR REPLACE INTO settings VALUES(?,?)',('closed','1' if data['closed'] else '0'))
  if data['closed']:c.execute("UPDATE sessions SET mode='remote',visible=0,expires=0,drink='',activity=''")
  c.execute('INSERT INTO audit VALUES(?,?,?,?,?,?)',(secrets.token_hex(12),uid,path,'cafe',reason,now))
 elif path.startswith('/api/staff/'):
  try:receipt=operations.dispatch(c,uid,path,data)
  except operations.OpsError as e:raise APIError(e.message,e.status)
  result=state(c,uid);result['receipt']=receipt;return result
 else:raise APIError('없는 기능이에요',404)
 return state(c,uid)

class Handler(SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('X-Content-Type-Options','nosniff')
  self.send_header('Referrer-Policy','same-origin')
  self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
  super().end_headers()
 def log_message(self,format,*args):pass # Never log tokens, query strings or guest identifiers.
 def send_json(self,obj,status=200,cookie=None):
  body=json.dumps(obj,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff')
  if cookie:self.send_header('Set-Cookie',cookie)
  self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def user(self,c):
  try:token=SimpleCookie(self.headers.get('Cookie','')).get('cafe_session');token=token.value if token else ''
  except:token=''
  row=c.execute('SELECT id FROM users WHERE token=?',(hashlib.sha256(token.encode()).hexdigest(),)).fetchone();return row['id'] if row else None
 def do_GET(self):
  path=unquote(urlsplit(self.path).path)
  if path.startswith('/api/'):
   with transaction() as c:
    uid=self.user(c)
    if path=='/api/state':self.send_json(state(c,uid));return
    if path=='/api/staff/dashboard' and uid:
     try:
      result=operations.dashboard(c,uid)
      if c.execute('SELECT role FROM users WHERE id=?',(uid,)).fetchone()['role']=='admin':result['content']={'items':catalogue.latest(c,'item'),'quests':catalogue.latest(c,'quest')}
      self.send_json(result)
     except operations.OpsError as e:self.send_json({'error':e.message},e.status)
     return
    if path=='/api/health':self.send_json({'ok':True});return
    if path=='/api/blocks' and uid:
     self.send_json([dict(r) for r in c.execute('SELECT u.id,u.nickname FROM blocks b JOIN users u ON u.id=b.target WHERE b.uid=?',(uid,))]);return
   self.send_json({'error':'연결되지 않은 기능이에요'},404);return
  allowed={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/script.js':'script.js'}
  if path in allowed:self.path='/'+allowed[path]
  elif not path.startswith('/public/assets/') or '..' in path or not (ROOT/path.lstrip('/')).resolve().is_relative_to((ROOT/'public/assets').resolve()):self.send_error(404);return
  return super().do_GET()
 def do_HEAD(self):
  path=unquote(urlsplit(self.path).path)
  if path not in ('/','/index.html','/style.css','/script.js') and (not path.startswith('/public/assets/') or '..' in path or not (ROOT/path.lstrip('/')).resolve().is_relative_to((ROOT/'public/assets').resolve())):
   self.send_error(404);return
  super().do_HEAD()
 def do_POST(self):
  if not rate_allowed(self.client_address[0]):self.send_json({'error':'잠시 후 다시 시도해주세요'},429);return
  if self.headers.get('Content-Type','').split(';')[0]!='application/json':self.send_json({'error':'JSON 요청이 필요해요'},415);return
  origin=self.headers.get('Origin'); host=self.headers.get('Host')
  if origin and urlsplit(origin).netloc!=host:self.send_json({'error':'허용되지 않은 요청'},403);return
  try:
   length=int(self.headers.get('Content-Length','0'))
   if length<0 or length>16384:raise APIError('요청이 너무 커요',413)
   data=json.loads(self.rfile.read(length) or b'{}')
   if not isinstance(data,dict):raise APIError('잘못된 요청이에요')
   path=urlsplit(self.path).path
   with transaction() as c:
    uid=self.user(c)
    if path=='/api/guest':
     if uid:result=state(c,uid);cookie=None
     else:
      nickname=str(data.get('nickname','')).strip()
      if not 1<=len(nickname)<=16:raise APIError('닉네임은 1~16글자로 입력해주세요')
      uid=secrets.token_hex(12);token=secrets.token_urlsafe(32)
      appearance={'color':str(data.get('appearance',{}).get('color','#a58acb'))[:12]} if isinstance(data.get('appearance',{}),dict) else {'color':'#a58acb'}
      c.execute('INSERT INTO users(id,token,nickname,appearance) VALUES(?,?,?,?)',(uid,hashlib.sha256(token.encode()).hexdigest(),nickname,json.dumps(appearance)))
      c.execute('INSERT INTO sessions(uid,active) VALUES(?,?)',(uid,time.time()));result=state(c,uid)
      secure='; Secure' if os.environ.get('CAFE_SECURE_COOKIE')=='1' else ''
      cookie=f'cafe_session={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000{secure}'
    else:
     if not uid:raise APIError('먼저 캐릭터를 만들어주세요',401)
     cookie='cafe_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' if path=='/api/logout' else None; key=self.headers.get('Idempotency-Key','')
     if len(key)>128:raise APIError('잘못된 요청 키')
     protected=path in ('/api/buy','/api/stamps/redeem','/api/stamps/convert') or path.startswith('/api/staff/') or (path=='/api/quest' and data.get('action')=='claim')
     if protected and not key:raise APIError('거래 요청 키가 필요해요')
     digest=hashlib.sha256((path+json.dumps(data,sort_keys=True)).encode()).hexdigest()
     previous=c.execute('SELECT * FROM requests WHERE uid=? AND key=?',(uid,key)).fetchone() if key else None
     if previous:
      if previous['body']!=digest:raise APIError('다른 요청에 같은 거래 키를 사용할 수 없어요',409)
      result=state(c,uid)
      cached=json.loads(previous['response']) if previous['response']!='ok' else {}
      if 'receipt' in cached:result['receipt']=cached['receipt']
     else:
      result=act(c,uid,path,data)
      if key:c.execute('INSERT INTO requests VALUES(?,?,?,?)',(uid,key,digest,json.dumps({'receipt':result['receipt']} if 'receipt' in result else {})))
   self.send_json(result,cookie=cookie)
  except APIError as e:self.send_json({'error':e.message},e.status)
  except (ValueError,TypeError,KeyError):self.send_json({'error':'잘못된 입력이에요'},400)
  except Exception:self.send_json({'error':'요청 처리 중 문제가 생겼어요. 상태를 다시 확인해주세요'},500)
if __name__=='__main__':
 init_db();os.chdir(ROOT);print('Cafe Quest: http://127.0.0.1:'+os.environ.get('PORT','8000'),flush=True)
 ThreadingHTTPServer((os.environ.get('HOST','127.0.0.1'),int(os.environ.get('PORT','8000'))),Handler).serve_forever()
