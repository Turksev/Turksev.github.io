# -*- coding: utf-8 -*-
"""obek-cikti/*.json -> tools/obek-turleri.js (duzeltilmis tur etiketleri)."""
import collections
import io
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
BURASI = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(BURASI)
GECERLI = ['deyimsel fiil', 'edat kalıbı', 'sabit ifade', 'geçiş ifadesi', 'sıradan']

etiket = {}
eksik = []
for ad in sorted(os.listdir(os.path.join(BURASI, 'obek-girdi'))):
    girdi = json.load(io.open(os.path.join(BURASI, 'obek-girdi', ad), encoding='utf-8'))
    yol = os.path.join(BURASI, 'obek-cikti', ad)
    if not os.path.exists(yol):
        eksik.append(ad)
        continue
    cikti = {x['f']: x['t'] for x in json.load(io.open(yol, encoding='utf-8'))
             if isinstance(x, dict) and x.get('t') in GECERLI}
    for g in girdi:
        t = cikti.get(g['f'])
        if t:
            etiket[g['f']] = t
        else:
            eksik.append('%s: %s' % (ad, g['f']))

print('etiketlenen:', len(etiket), '| eksik:', len(eksik))
for e in eksik[:10]:
    print('  eksik', e)
print(collections.Counter(etiket.values()).most_common())

satirlar = ['  %s: %s' % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False))
            for k, v in sorted(etiket.items())]
icerik = (
    '/* ============================================================\n'
    '   Öbek tür etiketleri — dönüştürücü girdisi (site bu dosyayı YÜKLEMEZ)\n\n'
    '   Kaynak xlsx\'teki etiketler karışıktı: gerçek phrasal verb\'lerle düz\n'
    '   fiil+edat birleşmeleri aynı torbadaydı. Buradaki etiketler kaynağın\n'
    '   üzerine yazılır; "sıradan" işaretliler listeden tamamen düşer.\n\n'
    '   Türler: deyimsel fiil | edat kalıbı | sabit ifade | geçiş ifadesi | sıradan\n'
    '   Üretim: tools/test-uretim/obek-birlestir.py\n'
    '   ============================================================ */\n\n'
    'window.OBEK_TURLERI = {\n' + ',\n'.join(satirlar) + '\n};\n')
io.open(os.path.join(TOOLS, 'obek-turleri.js'), 'w', encoding='utf-8', newline='\n').write(icerik)
print('yazıldı tools/obek-turleri.js')
