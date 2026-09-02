# -*- coding: utf-8 -*-
"""Aile kartı katmanının yuvarlanmamış source_score ile verildiğini sınar."""

import ast
from pathlib import Path


site = Path(__file__).resolve().parents[2]
kaynak = site / "tools" / "listeyi-aktar.py"
agac = ast.parse(kaynak.read_text(encoding="utf-8"), filename=str(kaynak))
secilen = []
for dugum in agac.body:
    if isinstance(dugum, ast.Assign):
        adlar = {hedef.id for hedef in dugum.targets if isinstance(hedef, ast.Name)}
        if adlar & {"KATMANLAR", "AILE_KATMANI"}:
            secilen.append(dugum)
    elif isinstance(dugum, (ast.FunctionDef, ast.AsyncFunctionDef)):
        if dugum.name in {"katman_bul", "aile_kart_katmani"}:
            secilen.append(dugum)

alan = {}
exec(compile(ast.Module(body=secilen, type_ignores=[]), str(kaynak), "exec"), alan)
katman = alan["aile_kart_katmani"]

beklenen = {
    9.9994: 7,
    10.0: 6,
    11.999: 6,
    12.001: 5,
    16.999: 5,
    17.001: 4,
    39.999: 2,
    40.0: 1,
}
for puan, sonuc in beklenen.items():
    bulunan = katman(puan)
    if bulunan != sonuc:
        raise AssertionError("source_score %s: K%s yerine K%s" % (puan, sonuc, bulunan))

print("aile-katman-esik: 9.9994 ve 11.999/12.001 dahil %d sınır başarılı" % len(beklenen))
