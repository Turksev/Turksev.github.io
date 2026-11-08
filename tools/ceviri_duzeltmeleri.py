"""Apply the reviewed translation layer after legacy examples and phrase audits.

All guards are checked on a copy before committing any change. Card identifiers,
meaning positions, ratings, alternative counts and phrases are preserved.
"""
from copy import deepcopy
import json
from pathlib import Path


def uygula(kelimeler, review=None):
    if review is None:
        review = json.loads((Path(__file__).parent/'ceviri-denetimi/2026-11-08.json').read_text(encoding='utf-8'))
    if review.get('schema_version') != 1:
        raise ValueError('Unsupported translation review schema')
    staged = deepcopy(kelimeler)
    seen = set()
    for row in review['rows']:
        word, index = row['word'], row['sense_index']
        key = (word, index)
        if key in seen or word not in staged:
            raise ValueError(f'{key}: missing or duplicate translation target')
        seen.add(key)
        senses = staged[word]['anlamlar']
        if len(senses) != row['sense_count'] or type(index) is not int or not 0 <= index < len(senses):
            raise ValueError(f'{key}: changed sense positions')
        sense = senses[index]
        current = {k:sense[k] for k in ('tr','ex','exTr','exs') if k in sense}
        if current != row['expected']:
            raise ValueError(f'{key}: stale translation review guard')
        replacement = row['replacement']
        if not {'tr','ex','exTr'} <= replacement.keys() or replacement.keys() - {'tr','ex','exTr','exs'}:
            raise ValueError(f'{key}: incomplete translation replacement')
        if len(current.get('exs', [])) != len(replacement.get('exs', [])):
            raise ValueError(f'{key}: alternatives must be preserved')
        for pair in [replacement]+replacement.get('exs', []):
            for k in ('ex','exTr'):
                text = pair.get(k)
                if not isinstance(text,str) or not text.strip() or text != text.strip() or '<' in text or '>' in text:
                    raise ValueError(f'{key}: incomplete English/Turkish pair')
        for k in ('tr','ex','exTr','exs'):
            sense.pop(k,None)
        sense.update(deepcopy(replacement))
    for row in review.get('short_meanings', []):
        staged[row['word']]['kisa'] = row['replacement']
    kelimeler.clear()
    kelimeler.update(staged)
    return len(seen)


if __name__ == '__main__':
    import sys
    data = json.load(sys.stdin)
    count = uygula(data['cards'], data.get('review'))
    json.dump({'count':count, 'cards':data['cards']},sys.stdout,ensure_ascii=False)
