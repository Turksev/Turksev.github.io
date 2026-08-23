# -*- coding: utf-8 -*-
"""assets/js/cekim.js'in Python karsiligi.

Tablolar JS dosyasindan OKUNUR (tek kaynak); kurallar elle portlanmistir.
Chrome uzerinden parite testi: parite.html + parite_kontrol.py
"""
import io
import re
import os

SITE = r'C:\Users\Trk\Desktop\Turksev.github.io'
JS = os.path.join(SITE, 'assets', 'js', 'cekim.js')


def _blok(kaynak, ad):
    i = kaynak.index('var %s = {' % ad)
    j = kaynak.index('\n  };', i)
    return kaynak[i:j]


def _tablo(kaynak, ad):
    """key: ['a','b'] | key: 'x' | key: 1  ->  {key: deger}"""
    govde = _blok(kaynak, ad)
    sonuc = {}
    for anahtar, deger in re.findall(r"(\w+):\s*(\[[^\]]*\]|'[^']*'|1)", govde):
        if deger.startswith('['):
            sonuc[anahtar] = re.findall(r"'([^']*)'", deger)
        elif deger.startswith("'"):
            sonuc[anahtar] = deger[1:-1]
        else:
            sonuc[anahtar] = 1
    return sonuc


_src = io.open(JS, encoding='utf-8').read()
DUZENSIZ_FIIL = _tablo(_src, 'DUZENSIZ_FIIL')
ONEKLI_FIIL = _tablo(_src, 'ONEKLI_FIIL')
DUZENSIZ_ISIM = _tablo(_src, 'DUZENSIZ_ISIM')
SAYILMAZ = _tablo(_src, 'SAYILMAZ')
IKILE = _tablo(_src, 'IKILE')
ONEKLI_FIIL.pop('rebuild2', None)

UNLU = set('aeiou')


def _unlu_sayisi(s):
    return len(re.findall(r'[aeiouy]+', s))


def ikilenir_mi(k):
    if k in IKILE:
        return True
    if len(k) < 3:
        return False
    son, orta, bas = k[-1], k[-2], k[-3]
    if son not in 'bcdfgklmnprstvz':
        return False
    if orta not in UNLU or bas in UNLU:
        return False
    return _unlu_sayisi(k) == 1


def ucuncu_tekil(k):
    if re.search(r'(s|x|z|ch|sh)$', k):
        return k + 'es'
    if re.search(r'[^aeiou]y$', k):
        return k[:-1] + 'ies'
    if re.search(r'[^aeiou]o$', k):
        return k + 'es'
    return k + 's'


def duzenli_gecmis(k):
    if k.endswith('e'):
        return k + 'd'
    if re.search(r'[^aeiou]y$', k):
        return k[:-1] + 'ied'
    if ikilenir_mi(k):
        return k + k[-1] + 'ed'
    return k + 'ed'


def ing_hali(k):
    if k.endswith('ie'):
        return k[:-2] + 'ying'
    if re.search(r'[^eoy]e$', k):
        return k[:-1] + 'ing'
    if ikilenir_mi(k):
        return k + k[-1] + 'ing'
    return k + 'ing'


def duzensiz_fiil(k):
    return DUZENSIZ_FIIL.get(k) or ONEKLI_FIIL.get(k) or None


def cogul(k):
    if k in SAYILMAZ:
        return None
    if k in DUZENSIZ_ISIM:
        return DUZENSIZ_ISIM[k]
    if re.search(r'(s|x|z|ch|sh)$', k):
        return k + 'es'
    if re.search(r'[^aeiou]y$', k):
        return k[:-1] + 'ies'
    if re.search(r'[^aeiou]o$', k) and not re.search(r'(photo|piano|radio|video|memo|logo|kilo|zero|solo)$', k):
        return k + 'es'
    return k + 's'


def cek(kelime, bicim=''):
    k = (kelime or '').lower()
    if not k or re.search(r'[^a-z]', k):
        return None if bicim else k
    if bicim == '':
        return k
    if bicim == 's':
        return ucuncu_tekil(k)
    if bicim == 'pl':
        return cogul(k)
    if bicim == 'past':
        d = duzensiz_fiil(k)
        return d[0] if d else duzenli_gecmis(k)
    if bicim == 'pp':
        d = duzensiz_fiil(k)
        return (d[1] if len(d) > 1 else d[0]) if d else duzenli_gecmis(k)
    if bicim == 'ing':
        return ing_hali(k)
    return None


def uyar_mi(kelime, bicim, hedef):
    k = (kelime or '').lower()
    if re.search(r'[^a-z]', k):
        duz = k.replace('-', ' ')
        return hedef == k or hedef == duz or (bicim in ('s', 'pl') and hedef in (k + 's', k + 'es'))
    u = cek(k, bicim)
    if u is None:
        return False
    if u == hedef:
        return True
    if k.endswith('l') and k in IKILE:
        if bicim in ('past', 'pp') and hedef == k + 'ed':
            return True
        if bicim == 'ing' and hedef == k + 'ing':
            return True
    if bicim not in ('past', 'pp'):
        return False
    d = duzensiz_fiil(k)
    if d:
        return hedef in d or hedef == duzenli_gecmis(k)
    return bool(re.search(r'[^aeiou]t$', hedef)) and duzenli_gecmis(k) == hedef[:-1] + 'ed'
