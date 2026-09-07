"""Reviewed, guarded editorial batches applied after all legacy card sources.

No network access or source-workbook writes. A stale sense/collocation guard is
fatal: content must never silently attach to another meaning after regeneration.
"""
from copy import deepcopy
import json
from pathlib import Path

PARTILER = Path(__file__).resolve().parent / 'kart-icerik-partileri'


def partileri_oku(folder=PARTILER):
    result = []
    for file in sorted(Path(folder).glob('*.json')):
        batch = json.loads(file.read_text(encoding='utf-8-sig'))
        if batch.get('schema_version') != 1:
            raise ValueError(f'{file.name}: unsupported editorial schema')
        batch['_file'] = file.name
        result.append(batch)
    return result


def _pair(pair, english='ex', turkish='exTr'):
    if not isinstance(pair, dict) or set(pair) != {english, turkish}:
        raise ValueError('Expected an English/Turkish pair, without extra fields')
    for key in (english, turkish):
        if not isinstance(pair[key], str) or not pair[key].strip() or pair[key] != pair[key].strip():
            raise ValueError(f'Invalid or untrimmed {key}')
        if '<' in pair[key] or '>' in pair[key]:
            raise ValueError('Editorial examples must contain plain text')


def uygula(kelimeler, batches=None):
    batches = partileri_oku() if batches is None else batches
    source = deepcopy(kelimeler)
    changes = deepcopy(kelimeler)
    seen = set()
    counts = {'corrections': 0, 'collocations': 0, 'alternatives': 0}

    def sense(row):
        word, index = row.get('word'), row.get('sense_index')
        if word not in source or type(index) is not int or not 0 <= index < len(source[word]['anlamlar']):
            raise ValueError(f'{word}: unknown word or sense {index}')
        expected = row.get('expected')
        if not isinstance(expected, dict) or not {'tr', 'ex'} <= set(expected) or set(expected) - {'tr', 'ex', 'exTr'}:
            raise ValueError(f'{word}: incomplete sense guard')
        if any(source[word]['anlamlar'][index].get(key) != val for key, val in expected.items()):
            raise ValueError(f'{word}[{index}]: stale editorial sense guard')
        return changes[word]['anlamlar'][index]

    for batch in batches:
        if batch.get('schema_version') != 1:
            raise ValueError('Unsupported editorial schema')
        for category in ('corrections', 'enrichments', 'collocations'):
            rows = batch.get(category, [])
            if not isinstance(rows, list):
                raise ValueError(f'{category}: expected a list')
            for row in rows:
                word = row.get('word')
                identity = (category, word, row.get('sense_index'))
                if identity in seen:
                    raise ValueError(f'{identity}: duplicate editorial operation')
                seen.add(identity)
                if category == 'collocations':
                    if word not in source or source[word].get('kalip', []) != row.get('expected'):
                        raise ValueError(f'{word}: stale collocation guard')
                    replacement = row.get('replacement')
                    if not isinstance(replacement, list) or not replacement:
                        raise ValueError(f'{word}: empty collocation replacement')
                    for pair in replacement:
                        _pair(pair, 'en', 'tr')
                    if len({p['en'].casefold() for p in replacement}) != len(replacement):
                        raise ValueError(f'{word}: duplicate collocation')
                    changes[word]['kalip'] = deepcopy(replacement)
                    counts['collocations'] += 1
                    continue
                target = sense(row)
                if category == 'corrections':
                    replacement = row.get('replacement', {})
                    if set(replacement) - {'tr', 'ex', 'exTr'} or not {'ex', 'exTr'} <= set(replacement):
                        raise ValueError(f'{word}: correction must contain a full EN/TR pair')
                    _pair({key: replacement[key] for key in ('ex', 'exTr')})
                    if 'tr' in replacement and (not isinstance(replacement['tr'], str) or not replacement['tr'].strip()):
                        raise ValueError(f'{word}: empty meaning')
                    target.update(deepcopy(replacement))
                    counts['corrections'] += 1
                else:
                    alternatives = row.get('alternatives')
                    if not isinstance(alternatives, list) or not alternatives:
                        raise ValueError(f'{word}: empty alternative examples')
                    for pair in alternatives:
                        _pair(pair)
                    target['exs'] = deepcopy(alternatives)
                    counts['alternatives'] += len(alternatives)

    # Final checks run after corrections regardless of the order of batch files.
    for word, card in changes.items():
        for meaning in card['anlamlar']:
            pairs = [{'ex': meaning['ex'], 'exTr': meaning['exTr']}] + meaning.get('exs', [])
            if len({p['ex'].strip().casefold() for p in pairs}) != len(pairs):
                raise ValueError(f'{word}: alternative duplicates a main/alternative example')
    kelimeler.clear()
    kelimeler.update(changes)
    return counts
