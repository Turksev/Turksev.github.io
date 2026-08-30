# -*- coding: utf-8 -*-
"""parite.html'in JS ciktisiyla cekim.py'yi karsilastirir.

  python parite-karsilastir.py <parite-cikti.json>

parite.html'i headless Chrome ile calistirip <pre id="out"> icerigini bu
betige ver; iki motorun butun dizin uzerinde ayni sonucu verdigi dogrulanir.
"""
import io
import json
import sys

import cekim

sys.stdout.reconfigure(encoding='utf-8')
BICIMLER = ['', 's', 'past', 'pp', 'ing', 'pl']

js = json.load(io.open(sys.argv[1], encoding='utf-8'))
fark = 0
karsilastirma = 0
for e, satir in js.items():
    for f, beklenen in zip(BICIMLER, satir):
        karsilastirma += 1
        bizim = cekim.cek(e, f)
        if bizim != beklenen:
            fark += 1
            if fark <= 20:
                print('FARK %-22s %-5s js=%r py=%r' % (e, f or "''", beklenen, bizim))
print('%d karşılaştırma · %d fark' % (karsilastirma, fark))
sys.exit(1 if fark else 0)
