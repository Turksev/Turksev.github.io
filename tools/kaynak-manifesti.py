# -*- coding: utf-8 -*-
"""YDS sınav PDF'leri için içerik kopyalamayan provenans manifesti üretir.

PDF'leri değiştirmez ve içlerindeki soru metinlerini çıkarmaz. Yalnız dosya
adından doğrulanabilen sınav kimliğini, dosya boyutunu ve SHA-256 özetini
``data/kaynak-manifest.json`` içine yazar.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path


SITE = Path(__file__).resolve().parent.parent
sys.stdout.reconfigure(encoding="utf-8")
VARSAYILAN_KAYNAK = Path(r"C:\Users\Trk\Desktop\YDS Soru Veritabanı\08_unique_exam_pdfs")
VARSAYILAN_CIKTI = SITE / "data" / "kaynak-manifest.json"
DOSYA_DESENI = re.compile(
    r"^(?P<tur>e?YDS)_(?P<yil>\d{4})_(?P<donem>[^_]+)_"
    r"(?P<tarih>\d{4}-\d{2}-\d{2})_(?P<dil>[A-Z]+)_"
    r"(?P<kapsam>FULL|P10)_COMBINED_(?P<etiket>OFFICIAL)_"
    r"(?P<kisa_ozet>[0-9a-f]{8})\.pdf$"
)


def sha256(yol: Path) -> str:
    ozet = hashlib.sha256()
    with yol.open("rb") as akis:
        for parca in iter(lambda: akis.read(1024 * 1024), b""):
            ozet.update(parca)
    return ozet.hexdigest()


def kayit(yol: Path) -> dict[str, object]:
    eslesme = DOSYA_DESENI.fullmatch(yol.name)
    if not eslesme:
        raise ValueError(f"Beklenmeyen PDF dosya adı: {yol.name}")
    alan = eslesme.groupdict()
    tam_ozet = sha256(yol)
    if not tam_ozet.startswith(alan["kisa_ozet"]):
        raise ValueError(f"Dosya adındaki özet içerikle uyuşmuyor: {yol.name}")
    return {
        "id": f"{alan['tur'].lower()}-{alan['yil']}-{alan['donem'].lower()}-{alan['tarih']}",
        "sinav_turu": alan["tur"],
        "yil": int(alan["yil"]),
        "donem": alan["donem"],
        "tarih": alan["tarih"],
        "dil": alan["dil"],
        "yayin_kapsami_etiketi": alan["kapsam"],
        "dosya_resmiyet_etiketi": alan["etiket"],
        "dosya": yol.name,
        "bayt": yol.stat().st_size,
        "sha256": tam_ozet,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kaynak", type=Path, default=VARSAYILAN_KAYNAK)
    parser.add_argument("--cikti", type=Path, default=VARSAYILAN_CIKTI)
    parser.add_argument("--beklenen", type=int, default=49)
    ayar = parser.parse_args()

    pdfler = sorted(ayar.kaynak.glob("*.pdf"), key=lambda p: p.name.casefold())
    if len(pdfler) != ayar.beklenen:
        raise SystemExit(
            f"Kaynak sayısı uyuşmuyor: {len(pdfler)} PDF bulundu, "
            f"{ayar.beklenen} bekleniyordu. Manifest yazılmadı."
        )

    sinavlar = [kayit(yol) for yol in pdfler]
    kimlikler = [sinav["id"] for sinav in sinavlar]
    ozetler = [sinav["sha256"] for sinav in sinavlar]
    if len(set(kimlikler)) != len(kimlikler):
        raise SystemExit("Yinelenen sınav kimliği bulundu. Manifest yazılmadı.")
    if len(set(ozetler)) != len(ozetler):
        raise SystemExit("Aynı içeriğe sahip yinelenen PDF bulundu. Manifest yazılmadı.")

    manifest = {
        "sema_surumu": 1,
        "aciklama": (
            "Kelime puanlamasında kaynak kabul edilen sınav PDF'lerinin "
            "içerik kopyalamayan provenans kaydı."
        ),
        "telif_notu": (
            "Bu manifest PDF veya soru metni içermez. Sınav belgeleri ve soru "
            "metinleri üzerindeki haklar ilgili hak sahiplerine aittir; bu kayıt "
            "yeniden kullanım izni verdiği anlamına gelmez."
        ),
        "uretim_araci": "tools/kaynak-manifesti.py",
        "sinav_sayisi": len(sinavlar),
        "sinavlar": sinavlar,
    }
    ayar.cikti.parent.mkdir(parents=True, exist_ok=True)
    ayar.cikti.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{len(sinavlar)} sınav -> {ayar.cikti}")


if __name__ == "__main__":
    main()
