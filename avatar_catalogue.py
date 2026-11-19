"""Manifest-driven avatar02 validation; freely try-on cosmetics, no economy rules."""
import json
from functools import lru_cache
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / 'avatar02' / 'manifest.json'


def default_avatar():
    return {'selection': {}, 'lens': 'charcoal'}


@lru_cache(maxsize=1)
def manifest():
    return json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))


def validate(value):
    if not isinstance(value, dict) or set(value) - {'selection', 'lens'}:
        raise ValueError('캐릭터 선택 형식을 확인해주세요')
    selected = value.get('selection', {})
    if not isinstance(selected, dict):
        raise ValueError('캐릭터 슬롯별 선택이 필요해요')
    items = {item['id']: item for item in manifest()['items']}
    slots = {item['slot'] for item in items.values()}
    if set(selected) - slots:
        raise ValueError('지원하지 않는 캐릭터 슬롯이에요')
    selection = {}
    for slot, item_id in selected.items():
        if item_id is None or item_id == '':
            continue
        if not isinstance(item_id, str) or item_id not in items or items[item_id]['slot'] != slot:
            raise ValueError('해당 슬롯의 캐릭터 파츠를 선택해주세요')
        selection[slot] = item_id
    lens = value.get('lens', 'charcoal')
    if not isinstance(lens, str) or lens not in manifest()['lensColors']:
        raise ValueError('지원하지 않는 렌즈 색이에요')
    return {'selection': selection, 'lens': lens}


def client_appearance(appearance):
    # Preserve color, legacy inventory/equipment and future appearance keys.
    result = dict(appearance)
    # Do not inject avatar02 for legacy users: absence preserves legacy rendering.
    return result


@lru_cache(maxsize=1)
def runtime_paths():
    """Only manifest-referenced images and explicitly public runtime entrypoints."""
    paths = {'manifest.json', 'viewer.js', 'runtime.js', 'preview.html'}
    def walk(value):
        if isinstance(value, dict):
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)
        elif isinstance(value, str) and value.startswith('assets/'):
            path = PurePosixPath(value)
            if '..' not in path.parts and path.suffix == '.png':
                paths.add(value)
    walk(manifest())
    return frozenset('/avatar02/' + path for path in paths)


def static_allowed(path):
    if path not in runtime_paths():
        return False
    actual = (ROOT / path.lstrip('/')).resolve()
    return actual.is_relative_to((ROOT / 'avatar02').resolve()) and actual.is_file()
