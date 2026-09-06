"""Portable paths for the static site's offline production tools."""
from pathlib import Path
import os

SITE = Path(__file__).resolve().parent.parent


def site_path(*parts):
    return str(SITE.joinpath(*parts))


def yds_path(*parts):
    root = Path(os.environ.get('YDS_ROOT', SITE.parent)).resolve()
    if not (root / '03_calisma_listesi').is_dir():
        raise SystemExit('Kaynak kökü bulunamadı. YDS_ROOT ortam değişkenini 01–05 klasörlerinin bulunduğu YDS dizinine ayarlayın. Site önizlemesi için kaynak araçları gerekmez.')
    return str(root.joinpath(*parts))


def scratch_path(*parts):
    configured = os.environ.get('YDS_SCRATCH_ROOT')
    if not configured:
        raise SystemExit('Bu tarihsel araç ek çalışma girdisi istiyor. YDS_SCRATCH_ROOT değişkenini doğrulanmış girdilerin bulunduğu kalıcı klasöre ayarlayın; geçici klasörlerden sessiz çıktı üretilmez.')
    root = Path(configured).resolve()
    if not root.is_dir():
        raise SystemExit('YDS_SCRATCH_ROOT bulunamadı: ' + str(root))
    return str(root.joinpath(*parts))
