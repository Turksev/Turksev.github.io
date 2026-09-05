# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""bilgi_kart_veri.json -> site icin data/kelime-bilgi.js"""
import os, sys, io, re, json, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
VERI = r"C:\Users\Trk\Desktop\YDS\04_Github\data"
kart = json.load(open(os.path.join(SP, 'bilgi_kart_veri.json'), encoding='utf-8'))

DONEM = {'01': 'İlkbahar', '02': 'Sonbahar', '03': 'Aralık', 'INGILIZCE': 'Temmuz',
         '04': 'Nisan', '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
         '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'}
def sinav_adi(exam_id, yil):
    p = exam_id.split('_')
    aile = 'YDS' if p[0] == 'YDS' else 'e-YDS'
    return f"{yil} {DONEM.get(p[-1], p[-1])} {aile}"

J = lambda s: json.dumps(s, ensure_ascii=False)
satirlar = []
istat = collections.Counter()
for w, v in sorted(kart.items()):
    g = []
    for x in v['gecisler'][:4]:
        if not x.get('kok') or len(x['kok']) < 30:
            continue
        g.append({
            's': sinav_adi(x['sinav'], x['yil']),
            'b': x.get('tur') or '',
            'n': x.get('soru') or 0,
            'h': x.get('harf') or '',
            'd': 1 if x['dogru'] else 0,
            'sk': (x.get('sik_metni') or '')[:80],
            'k': ' '.join(x['kok'].split())[:260],
        })
    if not (v['dogru_cevap'] or v['celdirici'] or v['sinav']):
        continue
    alan = ['e:' + J(w), 'p:%s' % v['p'], 'sv:%d' % v['sinav'], 'fr:%d' % v['frekans']]
    if v['dogru_cevap']:
        alan.append('dc:%d' % v['dogru_cevap']); istat['dogru'] += 1
    if v['celdirici']:
        alan.append('cd:%d' % v['celdirici']); istat['celdirici'] += 1
    if v['yillar']:
        alan.append('yl:' + J(','.join(v['yillar'])))
    if v['turler']:
        alan.append('tr:' + J(v['turler']))
    if g:
        alan.append('g:[' + ','.join(
            '{s:%s,b:%s,n:%d,h:%s,d:%d,sk:%s,k:%s}' %
            (J(x['s']), J(x['b']), x['n'], J(x['h']), x['d'], J(x['sk']), J(x['k']))
            for x in g) + ']')
        istat['gecisli'] += 1
    satirlar.append('{' + ','.join(alan) + '}')

basli = ('/* ============================================================\n'
         '   Kelime bilgi notu — %d kelime\n'
         '   Kelimenin sınavdaki kullanım analizi. Kart üzerindeki ℹ ile açılır.\n'
         '   Alanlar: e=kelime, p=YDS öncelik puanı, sv=kaç sınavda geçti,\n'
         '            fr=toplam geçiş, dc=kaç kez doğru cevap oldu,\n'
         '            cd=kaç kez çeldirici oldu, yl=yıllar, tr=soru türü dağılımı,\n'
         '            g=geçtiği sorular [s=sınav, b=bölüm, n=soru no, h=şık harfi,\n'
         '                               d=doğru mu, sk=şık metni, k=soru kökü]\n'
         '   tools/ ile üretilir; elle düzenleme.\n'
         '   ============================================================ */\n\n'
         'window.KELIME_BILGI = [\n' % len(satirlar))
icerik = basli + ',\n'.join(satirlar) + '\n];\n'
yol = os.path.join(VERI, 'kelime-bilgi.js')
open(yol, 'w', encoding='utf-8', newline='\n').write(icerik)
print(f"kelime-bilgi.js yazildi: {len(satirlar):,} kayit, {len(icerik)/1024:.0f} KB")
print(f"  dogru cevap olmus : {istat['dogru']:,}")
print(f"  celdirici olmus   : {istat['celdirici']:,}")
print(f"  gecis ornegi olan : {istat['gecisli']:,}")
