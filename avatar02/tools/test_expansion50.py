"""Enforce 50 genuinely additional selectable items and legacy byte preservation."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1]
old=json.loads((R/'tools/baseline-51-assets.json').read_text())
m=json.loads((R/'manifest.json').read_text())
items={i['id']:i for i in m['items']}
assert len(items)==len(m['items'])==101
legacy={i['id']:i for i in old['items']}
assert len(set(items)-set(legacy))==50
for id,item in legacy.items():
    for key,value in item.items():
        if key=='hatVariants':
            for hid,variant in value.items():
                assert items[id][key][hid]==variant,(id,hid)
        else: assert items[id].get(key)==value,(id,key)
for name,sha in old['assets'].items():
    assert hashlib.sha256((R/name).read_bytes()).hexdigest()==sha,name
specs=[s for p in (R/'source').glob('expansion50_*/sources.json') for s in json.loads(p.read_text())]
assert len(specs)==50 and len({s['id'] for s in specs})==50
assert {s['id'] for s in specs}==set(items)-set(legacy)
print('101 selectable items; exactly 50 new; 51 original item metadata and 1015 atlas hashes preserved (additional hat variants allowed).')
