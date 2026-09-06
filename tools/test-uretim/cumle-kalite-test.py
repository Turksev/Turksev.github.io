"""Üretici yan etkilerini çalıştırmadan saf içerik katmanı ve gerçek serializer testi."""
import ast
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools' / 'cumle'))
sys.path.insert(0, str(ROOT / 'tools'))
from kalite_duzelt import alanlari_uygula, kalite_uygula, kalite_alanlari, fnv_kimlik
import icerik_kalite

table = json.loads((ROOT / 'tools/cumle/cumle-kalite-duzeltmeleri.json').read_text(encoding='utf-8'))
assert len(table['records']) == 172
assert len(table['aliases']) == 6
assert len(table['incelemeler']) == 14
aliases = {x['from']: x['to'] for x in table['aliases']}
for x in table['records']:
    assert fnv_kimlik(x['eski']) == x['sid']
    k = {'e': x['eski'], 's': x['s'], 'n': 41, 'b': 'Before', 't': 'Translation', 'y': 2026, 'id': 'source-id'}
    out = kalite_uygula([k], table)[0]
    assert out['sid'] == aliases.get(x['sid'], x['sid'])
    assert out['s'] == k['s'] and out['id'] == k['id'] and out['y'] == k['y']
    assert out['e'] == x['e']
    for field in ('n', 'b'):
        assert out[field] == (x[field] if field in x else k[field])
    assert k['e'] == x['eski'], 'input must not mutate'
    assert kalite_uygula([out], table) == [out], ('idempotent', x, out, kalite_uygula([out], table))

k = {'e': 'Text.', 's': 'Source', 'y': 2026, 'id': 'id', 'b': 'Wrong', 'n': 41}
out = alanlari_uygula(k, {'n': None, 'b': '', 's': 'Wrong source', 'y': 2000})
assert out['n'] is None and out['b'] == ''
assert out['s'] == 'Source' and out['y'] == 2026
assert alanlari_uygula(k, {}) == k
assert fnv_kimlik('😀') == 'c:1kdnhdk-2'

source = (ROOT / 'tools/cumle/cumle_js_uret.py').read_text(encoding='utf-8')
tree = ast.parse(source)
satir = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'satir')
ns = {'J': lambda x: json.dumps(x, ensure_ascii=False), 'kalite_alanlari': kalite_alanlari}
exec(compile(ast.Module(body=[satir], type_ignores=[]), '<real serializer>', 'exec'), ns)
s = ns['satir'](dict(out, sid='c:old-1', inceleme='İnceleme gerekli.'))
assert 'n:' not in s and 'b:' not in s
assert 'sid:"c:old-1"' in s and 'inceleme:"İnceleme gerekli."' in s
assert source.index('kayitlar = genel_kurallar(kayitlar)') < source.index('kayitlar = kalite_uygula(kayitlar)') < source.index('def satir')
# Legacy n:0 means no override. New canonical null clearing is tested above.
assert "n=x.get('n') or k['n']" in source

lookup = {x['sid']: x for x in table['records']}
for alias in table['aliases']:
    target = lookup[alias['to']]
    dup = {'e': target['e'], 's': target['s'], 'y': 2026, 'sid': alias['from']}
    original = {'e': target['eski'], 's': target['s'], 'y': 2026}
    out = kalite_uygula([original, dup], table)
    assert len(out) == 1 and out[0]['sid'] == alias['to']
    out = kalite_uygula([dup, original], table)
    assert len(out) == 1 and out[0]['sid'] == alias['to']

qual = icerik_kalite.tablo_oku()
words = {en: {'anlamlar': [{'tr': 'old'}], 'tip': 'original'} for en in qual['kelimeler']}
examples = {en: [{'tr': 'reviewed', 'ex': 'A sentence.', 'exTr': 'Cümle.', 'yz': 3}] for en in qual['kelimeler']}
icerik_kalite.son_kart_duzeltmeleri(words, examples)
for en in words:
    assert words[en]['anlamlar'] == examples[en] and words[en]['tip'] == 'original'
    assert words[en]['anlamlar'] is not examples[en]
phrases = {en: {'anlamlar': [{'tr': 'old'}], 'sinav': 9, 'b': ['historical']} for en in qual['obekler']}
icerik_kalite.son_obek_duzeltmeleri(phrases)
for en in phrases:
    assert phrases[en]['anlamlar'] == qual['obekler'][en]
    assert phrases[en]['sinav'] == 9 and phrases[en]['b'] == ['historical']
words = {'albeit': {'tip': 'isim'}, 'modal': {'tip': 'correct-modal'}}
icerik_kalite.ek_parti_turlerini_duzelt(words, [{'kayitlar': [{'e': 'albeit'}]}], {'albeit': 'bağlaç', 'modal': 'must-not-override'})
assert words == {'albeit': {'tip': 'bağlaç'}, 'modal': {'tip': 'correct-modal'}}
source = (ROOT / 'tools/listeyi-aktar.py').read_text(encoding='utf-8')
assert source.index('    son_kart_duzeltmeleri(kelimeler, ek_ornekleri_oku())') > source.index('    duzeltme_uygulanan, duzeltme_eslesmeyen =')
assert source.index('    son_obek_duzeltmeleri(obek_sozlugu)') > source.index('    obek_birlesen, obek_adlanan, obek_takma_eksik =')
print('cumle-kalite: 172 FNV/sid, null temizleme, 14 inceleme, 6 tekrar, gerçek serializer ve son içerik katmanı başarılı')
