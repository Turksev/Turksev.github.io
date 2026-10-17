"""Final, sense-guarded usage phrases; applied after all earlier card sources."""
from copy import deepcopy
import json
from pathlib import Path

PARTILER = Path(__file__).resolve().parent / 'kalip-anlam-partileri'


def partileri_oku(folder=PARTILER):
    folder = Path(folder)
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    if manifest.get('schema_version') != 1:
        raise ValueError('Unsupported usage manifest')
    names = manifest.get('batches')
    if not isinstance(names, list) or not names or len(set(names)) != len(names):
        raise ValueError('Missing or duplicate usage batches')
    rows = []
    for name in names:
        if not isinstance(name, str) or Path(name).name != name or not name.endswith('.json'):
            raise ValueError('Invalid usage batch filename')
        batch = json.loads((folder / name).read_text(encoding='utf-8'))
        if batch.get('schema_version') != 1 or not isinstance(batch.get('words'), list):
            raise ValueError(f'{name}: invalid usage batch')
        rows.extend(batch['words'])
    if len(rows) != manifest.get('word_count'):
        raise ValueError('Incomplete usage collection')
    return rows


def _pairs(word, pairs):
    if not isinstance(pairs, list) or not pairs:
        raise ValueError(f'{word}: empty usage list')
    seen = set()
    for pair in pairs:
        if not isinstance(pair, dict) or set(pair) != {'en', 'tr'}:
            raise ValueError(f'{word}: expected English/Turkish pair')
        for value in pair.values():
            if not isinstance(value, str) or not value.strip() or value != value.strip() or '<' in value or '>' in value:
                raise ValueError(f'{word}: invalid usage text')
        key = pair['en'].casefold()
        if key in seen:
            raise ValueError(f'{word}: duplicate usage')
        seen.add(key)


def uygula(kelimeler, rows=None):
    rows = partileri_oku() if rows is None else rows
    staged = {}
    for row in rows:
        word = row.get('word')
        if word not in kelimeler or word in staged:
            raise ValueError(f'{word}: unknown or duplicate usage headword')
        card = kelimeler[word]
        meanings = [sense['tr'] for sense in card['anlamlar']]
        if meanings != row.get('expected_senses'):
            raise ValueError(f'{word}: stale usage sense guard')
        if card.get('kalip', []) != row.get('expected'):
            raise ValueError(f'{word}: stale usage phrase guard')
        replacement = row.get('replacement')
        _pairs(word, replacement)
        coverage = row.get('sense_coverage')
        if not isinstance(coverage, list) or len(coverage) != len(replacement):
            raise ValueError(f'{word}: missing sense coverage')
        covered = set()
        for indices in coverage:
            if not isinstance(indices, list) or any(type(i) is not int or not 0 <= i < len(meanings) for i in indices):
                raise ValueError(f'{word}: invalid sense index')
            if len(set(indices)) != len(indices):
                raise ValueError(f'{word}: repeated sense index')
            covered.update(indices)
        if covered != set(range(len(meanings))):
            raise ValueError(f'{word}: uncovered meaning')
        staged[word] = deepcopy(replacement)
    if set(staged) != set(kelimeler):
        raise ValueError('Usage collection must cover every word')
    # No source mutation before all words and guards have passed.
    for word, pairs in staged.items():
        kelimeler[word]['kalip'] = pairs
    return {'words': len(staged), 'patterns': sum(map(len, staged.values()))}
