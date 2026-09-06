#!/usr/bin/env python3
"""Create immutable runtime snapshots; no HTML edits, publishing or deletion.

Usage: python tools/release-uret.py --source . --output . --write
Without --write, print a deterministic manifest preview only.
Run after runtime edits and before root HTML URL rewriting / SW version update.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re

SUFFIXES = {'.js', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif',
            '.avif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.ogg', '.wav'}
TEXT_SUFFIXES = {'.js', '.css', '.json', '.svg'}
EXCLUDED = {'data/depo.js', 'data/release-manifest.json'}

def runtime_files(source: Path) -> list[Path]:
    files = []
    for part in ('assets', 'data'):
        folder = source / part
        if folder.is_dir():
            files.extend(p for p in folder.rglob('*') if p.is_file()
                         and p.suffix.lower() in SUFFIXES
                         and p.relative_to(source).as_posix() not in EXCLUDED
                         and not any(s.startswith('.') for s in p.relative_to(source).parts))
    return sorted(files, key=lambda p: p.relative_to(source).as_posix())

def original_path(url: str) -> str:
    url = url.removeprefix('./').removeprefix('/')
    return re.sub(r'^releases/[0-9a-f]{12}/', '', url)

def canonical_bytes(file: Path) -> bytes:
    data = file.read_bytes()
    if file.suffix.lower() in TEXT_SUFFIXES:
        return data.decode('utf-8-sig').replace('\r\n', '\n').replace('\r', '\n').encode('utf-8')
    return data

def manifest(source: Path) -> tuple[dict, list[tuple[Path, str, bytes]]]:
    digest = hashlib.sha256()
    payload = []
    records = []
    for file in runtime_files(source):
        relative = file.relative_to(source).as_posix()
        data = canonical_bytes(file)
        digest.update(relative.encode('utf-8'))
        digest.update(b'\0')
        digest.update(data)
        digest.update(b'\0')
        payload.append((file, relative, data))
        records.append({'yol': relative, 'sha256': hashlib.sha256(data).hexdigest(), 'bayt': len(data)})
    release = digest.hexdigest()[:12]
    prefix = '/releases/' + release + '/'
    sw = source / 'sw.js'
    required = []
    available = {record['yol'] for record in records}
    if sw.is_file():
        found = re.search(r'var TEMEL_DOSYALAR\s*=\s*(\[[\s\S]*?\]);', sw.read_text(encoding='utf-8'))
        if not found:
            raise ValueError('sw.js TEMEL_DOSYALAR listesi bulunamadi')
        for url in re.findall(r"['\"]([^'\"]+)['\"]", found.group(1)):
            relative = original_path(url)
            if relative in EXCLUDED:
                continue
            if relative.startswith(('assets/', 'data/')):
                if relative not in available:
                    raise ValueError('Precache runtime dosyasi eksik: ' + relative)
                required.append(prefix + relative)
            else:
                required.append(url)
    return {'sema': 1, 'surum': release, 'kok': prefix, 'dosyalar': records,
            'temel': list(dict.fromkeys(required))}, payload

def create(source: Path, output: Path, write: bool = False) -> dict:
    source, output = source.resolve(), output.resolve()
    result, payload = manifest(source)
    if not write:
        return result
    destination = output / 'releases' / result['surum']
    for _, relative, data in payload:
        target = destination / relative
        if target.is_file():
            if target.read_bytes() != data:
                raise ValueError('Immutable release yolu farkli icerik tasiyor: ' + str(target))
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    (output / 'release-manifest.json').write_bytes(
        (json.dumps(result, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
    return result

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path('.'))
    parser.add_argument('--output', type=Path, default=Path('.'))
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    result = create(args.source, args.output, args.write)
    print(json.dumps({'surum': result['surum'], 'kok': result['kok'],
                      'dosya': len(result['dosyalar']), 'bayt': sum(f['bayt'] for f in result['dosyalar']),
                      'temel': len(result['temel']), 'yazildi': args.write}, ensure_ascii=False))

if __name__ == '__main__':
    main()
