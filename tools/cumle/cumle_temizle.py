# -*- coding: utf-8 -*-
# KALICI KOPYA (5 Eylul 2026): ozgun betik 03_calisma_listesi/06_sandbox_2026-09/ altinda;
# girdi/cikti klasorleri orada oldugu icin SP/BURASI o klasore sabitlendi.
"""Kalan 12 cevirisiz kaydi isler: 4'unu kurtarir, 8'ini siler.

Artik kayitlarin yapisi: <onceki sorunun sik listesi> + <bu sorunun koku>.
Ham korpusta kalip su: "<kok ----.> <sik1..sik5> <sonraki kok ----.>" — siklarda
nokta olmadigi icin "cumle = noktaya kadar" kurali hepsini tek kayda yapistirmis.
Kurtarma, kuyruktaki gercek soru kokunu birakip bastaki sik listesini atmaktir.

Cevirili kayitlara HIC dokunulmaz: ayristirma yalnizca ',t:"' icermeyen
satirlara uygulanir (bazi kayitlarda b/n alanlari yok, kacisli tirnak var).
"""
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

YOL = r"C:\Users\Trk\Desktop\YDS\04_Github\data\cumleler.js"

# Artigin icinde aranan iz -> (birakilacak gercek cumle, Turkce cevirisi)
KURTAR = {
    'It can be inferred from the passage that the author': (
        'It can be inferred from the passage that the author ----.',
        'Parçadan, yazarın ---- olduğu çıkarılabilir.'),
    'The main point made in the passage is that': (
        'The main point made in the passage is that ----.',
        'Parçada öne sürülen ana düşünce, ---- olduğudur.'),
    'What could be the best title for the passage': (
        'What could be the best title for the passage?',
        'Parça için en uygun başlık ne olabilir?'),
    'unless they are heading back to their birthplace': (
        '---- unless they are heading back to their birthplace.',
        'Doğdukları yere dönmedikleri sürece ----.'),
}


def cevirisiz_ayir(satir):
    """Yalnizca ',t:\"' icermeyen kayitlar icin. b ve n istege bagli."""
    g = satir.strip().rstrip(',')
    assert g.startswith('{e:"') and g.endswith('}'), g[:60]
    g = g[4:-1]
    e, kalan = g.split('",s:"', 1)
    assert chr(92) not in e, 'kacisli tirnak: ' + e[:50]
    d = {'e': e, 'b': None, 'n': None, 'y': None}
    d['s'], kalan = kalan.split('"', 1)
    while kalan:
        if kalan.startswith(',b:"'):
            d['b'], kalan = kalan[4:].split('"', 1)
        elif kalan.startswith(',n:'):
            parca = kalan[3:].split(',', 1)
            d['n'] = parca[0]
            kalan = ',' + parca[1] if len(parca) > 1 else ''
        elif kalan.startswith(',y:'):
            d['y'], kalan = kalan[3:], ''
        else:
            raise AssertionError('beklenmeyen alan: ' + kalan[:40])
    return d


def satira_don(d, t):
    p = ['{e:"%s"' % d['e'], ',s:"%s"' % d['s']]
    if d['b'] is not None:
        p.append(',b:"%s"' % d['b'])
    if d['n'] is not None:
        p.append(',n:%s' % d['n'])
    p.append(',t:"%s"' % t)
    p.append(',y:%s}' % d['y'])
    return ''.join(p)


sat = io.open(YOL, encoding='utf-8').read().split('\n')
yeni, kurtarilan, silinen = [], [], []

for s in sat:
    if not s.startswith('{e:"') or ',t:"' in s:
        yeni.append(s)                      # veri disi satir ya da cevirili kayit
        continue
    d = cevirisiz_ayir(s)
    hedef = None
    for iz, ikili in KURTAR.items():
        if iz in d['e']:
            hedef = ikili
            break
    if hedef:
        eski = d['e']
        d['e'] = hedef[0]
        virgul = ',' if s.rstrip().endswith(',') else ''
        yeni.append(satira_don(d, hedef[1]) + virgul)
        kurtarilan.append((d['s'], d['b'], eski, d['e'], hedef[1]))
    else:
        silinen.append((d['s'], d['b'], d['e']))

print('KURTARILAN: %d' % len(kurtarilan))
for s_, b_, eski, yenice, ceviri in kurtarilan:
    print('  [%s | %s]' % (s_, b_))
    print('    once : %s' % eski[:105])
    print('    sonra: %s' % yenice)
    print('    tr   : %s' % ceviri)
    print()

print('SILINEN: %d' % len(silinen))
for s_, b_, e_ in silinen:
    print('  [%s | %s] %s' % (s_, b_, e_[:90]))

kalan = sum(1 for x in yeni if x.startswith('{e:"'))
cevirisiz = sum(1 for x in yeni if x.startswith('{e:"') and ',t:"' not in x)
print('\nkalan cumle: %d   cevirisiz: %d' % (kalan, cevirisiz))

son = max(i for i, x in enumerate(yeni) if x.startswith('{e:"'))
assert not yeni[son].rstrip().endswith(','), 'son satirda fazla virgul'

if '--yaz' not in sys.argv:
    print('\n(dry-run — yazmak icin --yaz)')
    raise SystemExit(0)

metin = '\n'.join(yeni).replace('YDS cümleleri — 7713 cümle',
                                'YDS cümleleri — %d cümle' % kalan)
io.open(YOL, 'w', encoding='utf-8', newline='\n').write(metin)
print('\nyazildi')
