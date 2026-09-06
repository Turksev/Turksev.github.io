"""Cümle denetimi: açık alan düzeltmeleri, kalıcı kimlik ve inceleme notları.

Ham arşiv değiştirilmez. Önce eski tablo/genel temizlik çalışır; bu katman
yayınlanan metne bağlıdır ve kendinden sonra yeniden oluşan tekrarları ayıklar.
"""
from copy import deepcopy
import json
import re
from pathlib import Path

SID = re.compile(r'^c:[a-z0-9]+-[a-z0-9]+$')


def norm(s):
    return ' '.join(str(s).split())


def fnv_kimlik(s):
    # JS charCodeAt UTF-16 birimleriyle birebir; astral karakterler de korunur.
    b = s.encode('utf-16-le', errors='surrogatepass')
    h = 2166136261
    for i in range(0, len(b), 2):
        h = ((h ^ (b[i] + 256 * b[i + 1])) * 16777619) & 0xffffffff
    def base36(n):
        out = ''
        while n:
            n, r = divmod(n, 36)
            out = '0123456789abcdefghijklmnopqrstuvwxyz'[r] + out
        return out or '0'
    return 'c:' + base36(h) + '-' + base36(len(b) // 2)


def alanlari_uygula(k, x):
    sonuc = deepcopy(k)
    # Açık null/boş b,n yanlış etiketi temizler; eksik alan eskiyi korur.
    # s/y/id kaynak ve kayıt kökenidir, düzeltme tablosu bunları değiştiremez.
    for alan in ('e', 't', 'b', 'n', 'sid', 'inceleme'):
        if alan in x:
            sonuc[alan] = x[alan]
    if 'sid' in sonuc and not SID.fullmatch(str(sonuc['sid'])):
        raise ValueError('Geçersiz cümle sid: ' + str(sonuc['sid']))
    return sonuc


def kalite_uygula(kayitlar, tablo=None):
    if tablo is None:
        with (Path(__file__).parent / 'cumle-kalite-duzeltmeleri.json').open(encoding='utf-8') as f:
            tablo = json.load(f)
    if tablo.get('schema') != 1:
        raise ValueError('Cümle kalite tablosu şeması geçersiz')
    duzelt = {(x['s'], norm(x['eski'])): x for x in tablo['records']}
    beklet = {(x['s'], norm(x['e'])): x for x in tablo.get('incelemeler', [])}
    takma = {x['from']: x['to'] for x in tablo.get('aliases', [])}
    sonuc = []
    gor = set()
    for ham in kayitlar:
        k = deepcopy(ham)
        x = duzelt.get((k['s'], norm(k['e'])))
        # Düzeltilmiş bir metin başka (yinelenen) kaydın eski metni olabilir.
        # Mevcut kalıcı kimliği farklı kaydın düzeltmesiyle yeniden eşleme.
        if x and (not k.get('sid') or k['sid'] == x.get('sid')):
            k = alanlari_uygula(k, x)
        notu = beklet.get((k['s'], norm(k['e'])))
        if notu:
            k = alanlari_uygula(k, {a: notu[a] for a in ('sid', 'inceleme')})
        sid = k.get('sid') or fnv_kimlik(k['e'])
        if sid in takma:
            k['sid'] = takma[sid]
        anahtar = (k['s'], norm(k['e']).lower())
        if anahtar in gor:
            continue
        gor.add(anahtar)
        sonuc.append(k)
    return sonuc


def kalite_alanlari(c, j):
    sonuc = []
    if c.get('sid'):
        if not SID.fullmatch(str(c['sid'])):
            raise ValueError('Geçersiz cümle sid')
        sonuc.append('sid:' + j(c['sid']))
    if c.get('inceleme'):
        if not isinstance(c['inceleme'], str):
            raise ValueError('inceleme metin olmalı')
        sonuc.append('inceleme:' + j(c['inceleme']))
    return sonuc
