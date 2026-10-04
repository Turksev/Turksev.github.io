#!/usr/bin/env python3
"""Delete release snapshots that no document links to.

release-manifest.json names the current release (surum) and the one before it
(onceki). Everything else under releases/ is an orphan: no HTML refers to it,
and sw.js keeps at most one previous cache. Orphans still count toward the
GitHub Pages size limit, so they are removed after each release.

  python tools/release-buda.py            delete orphans
  python tools/release-buda.py --kontrol  only list orphans; exit 1 if any
  python tools/release-buda.py --kok DIR  operate on another site root
"""
from __future__ import annotations
import argparse
import json
import re
import shutil
import sys
from pathlib import Path


def tutulanlar(kok: Path) -> list[str]:
    manifest = json.loads((kok / 'release-manifest.json').read_text(encoding='utf-8'))
    surumler = [manifest['surum']] + list(manifest.get('onceki') or [])
    for surum in surumler:
        if not isinstance(surum, str) or not re.fullmatch(r'[0-9a-f]{12}', surum):
            raise ValueError('Gecersiz surum kimligi: %r' % (surum,))
    return list(dict.fromkeys(surumler))


def yetimler(kok: Path) -> tuple[list[str], list[str]]:
    tutulan = tutulanlar(kok)
    klasor = kok / 'releases'
    mevcut = sorted(p.name for p in klasor.iterdir() if p.is_dir()) if klasor.is_dir() else []
    eksik = [s for s in tutulan if s not in mevcut]
    if eksik:
        raise ValueError('Manifestin tuttugu surum diskte yok: ' + ', '.join(eksik))
    return tutulan, [ad for ad in mevcut if ad not in tutulan]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--kok', type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument('--kontrol', action='store_true', help='yalniz listele; yetim varsa 1 ile cik')
    args = parser.parse_args()
    kok = args.kok.resolve()
    tutulan, yetim = yetimler(kok)
    if args.kontrol:
        print(json.dumps({'tutulan': tutulan, 'yetim': yetim}, ensure_ascii=False))
        if yetim:
            print('Baglanmayan release klasorleri var; python tools/release-buda.py calistir.', file=sys.stderr)
            return 1
        return 0
    for ad in yetim:
        shutil.rmtree(kok / 'releases' / ad)
    print(json.dumps({'tutulan': tutulan, 'silinen': yetim}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
