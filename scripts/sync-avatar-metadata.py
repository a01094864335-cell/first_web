"""Sync the offline demo whitelist from real shipped assets; never invent entries.
Run after synchronizing avatar02: python scripts/sync-avatar-metadata.py
Use --check in CI. Requires every referenced atlas to exist before updating.
"""
import argparse,json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
m=json.loads((root/'avatar02/manifest.json').read_text())
items={i['id']:i['slot'] for i in m['items']}
assert len(items)==len(m['items']), 'Duplicate avatar IDs'
def verify(value):
 if isinstance(value,dict):
  for v in value.values():verify(v)
 elif isinstance(value,list):
  for v in value:verify(v)
 elif isinstance(value,str) and value.endswith('.png'):
  path=(root/'avatar02'/value).resolve()
  assert path.is_relative_to((root/'avatar02/assets').resolve()) and path.is_file(), f'Missing or out-of-scope actual asset: {value}'
verify(m)
path=root/'demo-api.js';old=path.read_text();new=old
for key,value in [('AVATAR02_ITEMS',items),('AVATAR02_LENSES',m['lensColors'])]:
 new,n=re.subn(r'const '+key+r' = [^\n]+;',lambda _: 'const '+key+' = '+json.dumps(value,ensure_ascii=False)+';',new)
 assert n==1, f'Expected one {key} declaration'
if args.check:
 assert old==new,'Avatar mock metadata stale: run scripts/sync-avatar-metadata.py'
else:path.write_text(new)
print(f'Avatar offline metadata matches {len(items)} actual parts and {len(m["lensColors"])} lens colors')
