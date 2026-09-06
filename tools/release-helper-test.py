from __future__ import annotations
import importlib.util
from pathlib import Path
import tempfile

helper_path = Path(__file__).with_name('release-uret.py')
spec = importlib.util.spec_from_file_location('release_helper', helper_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

with tempfile.TemporaryDirectory(prefix='yds-release-test-') as tmp:
    root = Path(tmp)
    source, output = root / 'source', root / 'output'
    (source / 'assets/js').mkdir(parents=True)
    (source / 'data').mkdir()
    (source / 'assets/js/main.js').write_bytes(b'window.test = 1;\r\n')
    (source / 'data/depo.js').write_bytes(b'volatile diagnostic = 1;')
    (source / 'data/items.json').write_bytes(b'{"hello":"world"}\n')
    (source / 'sw.js').write_text("var TEMEL_DOSYALAR = ['./','./assets/js/main.js','./data/items.json','./data/depo.js'];", encoding='utf-8')
    first = module.create(source, output, True)
    assert len(first['dosyalar']) == 2 and len(first['temel']) == 3
    release = output / first['kok'].lstrip('/')
    assert (release / 'assets/js/main.js').read_bytes() == b'window.test = 1;\n'
    snapshot = (output / 'release-manifest.json').read_bytes()
    (source / 'assets/js/main.js').write_bytes(b'window.test = 1;\n')
    (source / 'data/depo.js').write_bytes(b'volatile diagnostic = 999999;')
    second = module.create(source, output, True)
    assert first == second and (output / 'release-manifest.json').read_bytes() == snapshot
    (source / 'assets/js/main.js').write_bytes(b'window.test = 2;\n')
    third = module.create(source, output, True)
    assert third['surum'] != first['surum'] and release.is_dir()
    target = output / third['kok'].lstrip('/') / 'assets/js/main.js'
    target.write_bytes(b'tampered')
    try:
        module.create(source, output, True)
    except ValueError:
        pass
    else:
        raise AssertionError('immutable collision must fail')
print('release helper PASS: deterministic LF, diagnostic exclusion, changed-content new path, old release retained, immutable collision rejected')
