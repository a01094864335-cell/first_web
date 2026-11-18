"""Versioned content and visit accounting. No user-specific secrets."""
import json, time, math

def init_schema(c, items, quests):
 c.executescript('''
 CREATE TABLE IF NOT EXISTS content(kind TEXT,id TEXT,version INTEGER,body TEXT,enabled INTEGER DEFAULT 1,starts REAL,ends REAL,PRIMARY KEY(kind,id,version));
 CREATE TABLE IF NOT EXISTS visits(uid TEXT,day TEXT,PRIMARY KEY(uid,day));
 CREATE TABLE IF NOT EXISTS quest_snapshots(uid TEXT,qid TEXT,cycle TEXT,version INTEGER,body TEXT,PRIMARY KEY(uid,qid,cycle));
 ''')
 for i,name,price,slot in items:
  c.execute('INSERT OR IGNORE INTO content(kind,id,version,body) VALUES(?,?,1,?)',('item',i,json.dumps({'name':name,'price':price,'slot':slot},ensure_ascii=False)))
 for i,title,description,reward,kind in quests:
  c.execute('INSERT OR IGNORE INTO content(kind,id,version,body) VALUES(?,?,1,?)',('quest',i,json.dumps({'title':title,'description':description,'reward':reward,'kind':kind},ensure_ascii=False)))
 c.execute('INSERT OR IGNORE INTO content(kind,id,version,body) VALUES(?,?,1,?)',('quest','monthly',json.dumps({'title':'이번 달 세 번의 쉼','description':'서로 다른 영업일에 세 번 QR 참여','reward':40,'kind':'cumulative'},ensure_ascii=False)))

def latest(c,kind):
 rows=c.execute('SELECT a.* FROM content a JOIN (SELECT id,MAX(version) version FROM content WHERE kind=? GROUP BY id) b ON a.id=b.id AND a.version=b.version WHERE a.kind=?',(kind,kind)).fetchall()
 return [dict(r)|json.loads(r['body'])|{'body':json.loads(r['body']),'enabled':bool(r['enabled'])} for r in rows]
def available(row,now=None):
 now=time.time() if now is None else now
 return bool(row['enabled']) and (row['starts'] is None or now>=row['starts']) and (row['ends'] is None or now<row['ends'])
def version(c,kind,id):return next((r for r in latest(c,kind) if r['id']==id),None)
def snapshot(c,uid,q,cycle):
 c.execute('INSERT OR IGNORE INTO quest_snapshots VALUES(?,?,?,?,?)',(uid,q['id'],cycle,q['version'],json.dumps(q,ensure_ascii=False)))
 return json.loads(c.execute('SELECT body FROM quest_snapshots WHERE uid=? AND qid=? AND cycle=?',(uid,q['id'],cycle)).fetchone()['body'])
def existing(c,uid,qid,cycle):
 r=c.execute('SELECT body FROM quest_snapshots WHERE uid=? AND qid=? AND cycle=?',(uid,qid,cycle)).fetchone()
 return json.loads(r['body']) if r else None

def edit(c,kind,data):
 if kind not in ('item','quest'):raise ValueError('잘못된 콘텐츠 종류')
 ident=str(data.get('id','')).strip()
 if not ident or len(ident)>50 or not all(ch.isalnum() or ch in '-_' for ch in ident):raise ValueError('콘텐츠 ID를 확인해주세요')
 prior=version(c,kind,ident)
 if prior and kind=='quest' and prior['kind'] in ('visit','cumulative'):raise ValueError('자동 방문 퀘스트는 현재 편집할 수 없어요')
 body=data.get('body',{})
 if not isinstance(body,dict):raise ValueError('콘텐츠 내용을 확인해주세요')
 if kind=='item':
  if body.get('slot') not in ('hat','prop','outfit'):raise ValueError('아이템 슬롯을 확인해주세요')
  if type(body.get('price'))!=int or not 0<=body['price']<=100000:raise ValueError('가격을 확인해주세요')
  body={k:body[k] for k in ('name','price','slot')}
 else:
  if body.get('kind') not in ('explore','mood','purchase'):raise ValueError('자동 방문 퀘스트는 현재 편집할 수 없어요')
  if type(body.get('reward'))!=int or not 0<=body['reward']<=10000:raise ValueError('보상을 확인해주세요')
  body={k:body[k] for k in ('title','description','reward','kind')}
 if any(not isinstance(v,str) or not v.strip() or len(v)>500 for k,v in body.items() if k not in ('price','reward')):raise ValueError('내용을 확인해주세요')
 starts=data.get('starts');ends=data.get('ends')
 if starts is not None and (type(starts) not in (int,float) or not math.isfinite(starts) or starts<0):raise ValueError('시작 시각을 확인해주세요')
 if ends is not None and (type(ends) not in (int,float) or not math.isfinite(ends) or ends<0 or (starts is not None and ends<=starts)):raise ValueError('종료 시각을 확인해주세요')
 if type(data.get('enabled',True))!=bool:raise ValueError('판매/참여 상태를 확인해주세요')
 prior=version(c,kind,ident);v=prior['version']+1 if prior else 1
 c.execute('INSERT INTO content VALUES(?,?,?,?,?,?,?)',(kind,ident,v,json.dumps(body,ensure_ascii=False),data.get('enabled',True),starts,ends))
 return v
