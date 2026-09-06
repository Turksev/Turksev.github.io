# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""bilgi_kart_veri.json -> site icin data/kelime-bilgi.js

    python tools/cumle/bilgi_js_uret.py            data/kelime-bilgi.js'i yazar
    python tools/cumle/bilgi_js_uret.py <yol>      baska yola yazar (deneme)

B2 (5 Eylul 2026): baglam (k, sk) alanlari bilgi_temizle.py ile temizlenir — Turkce
yonerge bloklari korpustaki gercek kokle degistirilir ya da atilir; baslik/soru-no
onekleri kirpilir; satir sonu tire bolmeleri birlestirilir; kucuk harfli parcalar
onarilir; kesme sozcuk sinirindan yapilir. Ayrintilar bilgi_temizle.py basinda.
"""
import os, sys, io, re, json, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bilgi_temizle import (Korpus, Sozluk, yonerge_kok_mu, kok_onar, temizle_kok, temizle_sik,
                           kisalt)

SP = "C:/Users/Trk/Desktop/YDS/03_calisma_listesi/06_sandbox_2026-09"
VERI = r"C:\Users\Trk\Desktop\YDS\04_Github\data"
kart = json.load(open(os.path.join(SP, 'bilgi_kart_veri.json'), encoding='utf-8'))
korpus, sozluk = Korpus(), Sozluk()
print(f"korpus: {len(korpus.kayitlar):,} blok | sozluk: {len(sozluk.kelimeler):,} kelime, "
      f"{len(sozluk.tireli):,} tireli sozcuk")

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
ornekler = []
for w, v in sorted(kart.items()):
    g = []
    for x in v['gecisler'][:4]:
        kok_ham = x.get('kok') or ''
        if yonerge_kok_mu(kok_ham):
            # Turkce yonerge soru numarasina yanlis baglanmis (duz3): gercek koku korpustan al.
            kok_ham = kok_onar(x['sinav'], x.get('soru'), x.get('sik_metni'), korpus)
            istat['yonerge_onarildi' if kok_ham else 'yonerge_atildi'] += 1
        kok = temizle_kok(kok_ham, x.get('soru') or 0, korpus, sozluk)
        if len(kok) < 30:
            continue
        sk = temizle_sik(x.get('sik_metni') or '', sozluk)
        if kok != ' '.join((x.get('kok') or '').split()):
            istat['kok_degisti'] += 1
            if len(ornekler) < 40:
                ornekler.append((w, (x.get('kok') or '')[:120], kok[:120]))
        if sk != (x.get('sik_metni') or '').strip():
            istat['sk_degisti'] += 1
        g.append({
            's': sinav_adi(x['sinav'], x['yil']),
            'b': x.get('tur') or '',
            'n': x.get('soru') or 0,
            'h': x.get('harf') or '',
            'd': 1 if x['dogru'] else 0,
            'sk': kisalt(sk, 80),
            'k': kisalt(kok, 260),
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
        istat['baglam'] += len(g)
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
yol = sys.argv[1] if len(sys.argv) > 1 else os.path.join(VERI, 'kelime-bilgi.js')
open(yol, 'w', encoding='utf-8', newline='\n').write(icerik)
print(f"kelime-bilgi.js yazildi: {len(satirlar):,} kayit, {len(icerik)/1024:.0f} KB -> {yol}")
print(f"  dogru cevap olmus : {istat['dogru']:,}")
print(f"  celdirici olmus   : {istat['celdirici']:,}")
print(f"  gecis ornegi olan : {istat['gecisli']:,}")
print(f"  baglam (g)        : {istat['baglam']:,}")
print(f"  yonerge -> gercek kok : {istat['yonerge_onarildi']:,} | atilan: {istat['yonerge_atildi']:,}")
print(f"  kok degisen       : {istat['kok_degisti']:,} | sk degisen: {istat['sk_degisti']:,}")
if '-v' in sys.argv:
    for w, eski, yeni in ornekler:
        print(f"  [{w}]\n     ESKI: {eski}\n     YENI: {yeni}")
