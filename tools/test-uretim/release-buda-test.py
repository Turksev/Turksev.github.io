# -*- coding: utf-8 -*-
"""release-buda.py: yalniz manifestin tuttugu surumler kalir, yetimler silinir."""
import json
import os
import subprocess
import sys
import tempfile

KOK = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BETIK = os.path.join(KOK, 'tools', 'release-buda.py')


def kur(dizin, surum, onceki, klasorler):
    with open(os.path.join(dizin, 'release-manifest.json'), 'w', encoding='utf-8') as f:
        json.dump({'sema': 1, 'surum': surum, 'kok': '/releases/%s/' % surum, 'dosyalar': [], 'temel': [],
                   'onceki': onceki}, f)
    for ad in klasorler:
        os.makedirs(os.path.join(dizin, 'releases', ad, 'assets'), exist_ok=True)
        with open(os.path.join(dizin, 'releases', ad, 'assets', 'a.js'), 'w') as f:
            f.write('1')


def calistir(dizin, *ek):
    return subprocess.run([sys.executable, BETIK, '--kok', dizin] + list(ek), capture_output=True, text=True)


with tempfile.TemporaryDirectory() as gecici:
    kur(gecici, 'aaaaaaaaaaaa', ['bbbbbbbbbbbb'], ['aaaaaaaaaaaa', 'bbbbbbbbbbbb', 'cccccccccccc', 'dddddddddddd'])
    kontrol = calistir(gecici, '--kontrol')
    assert kontrol.returncode == 1, kontrol
    assert json.loads(kontrol.stdout)['yetim'] == ['cccccccccccc', 'dddddddddddd']
    sil = calistir(gecici)
    assert sil.returncode == 0, sil
    assert json.loads(sil.stdout) == {'tutulan': ['aaaaaaaaaaaa', 'bbbbbbbbbbbb'], 'silinen': ['cccccccccccc', 'dddddddddddd']}
    kalan = sorted(os.listdir(os.path.join(gecici, 'releases')))
    assert kalan == ['aaaaaaaaaaaa', 'bbbbbbbbbbbb'], kalan
    temiz = calistir(gecici, '--kontrol')
    assert temiz.returncode == 0 and json.loads(temiz.stdout)['yetim'] == []

with tempfile.TemporaryDirectory() as gecici:
    # Manifestin tuttugu surum diskte yoksa hicbir sey silinmez.
    kur(gecici, 'aaaaaaaaaaaa', ['bbbbbbbbbbbb'], ['aaaaaaaaaaaa', 'cccccccccccc'])
    hata = calistir(gecici)
    assert hata.returncode != 0 and 'diskte yok' in (hata.stderr + hata.stdout)
    assert os.path.isdir(os.path.join(gecici, 'releases', 'cccccccccccc'))

with tempfile.TemporaryDirectory() as gecici:
    # onceki alani olmayan eski manifest: yalniz guncel surum tutulur.
    kur(gecici, 'aaaaaaaaaaaa', None, ['aaaaaaaaaaaa', 'bbbbbbbbbbbb'])
    sil = calistir(gecici)
    assert json.loads(sil.stdout)['silinen'] == ['bbbbbbbbbbbb']

print('release-buda: yetim surumler silinir, tutulanlar korunur, eksik surumde durur.')
