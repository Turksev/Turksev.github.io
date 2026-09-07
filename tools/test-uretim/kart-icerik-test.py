"""Editorial batch guards: no wrong-sense attachments or partial application."""
from copy import deepcopy
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from kart_icerik import uygula


class EditorialTest(unittest.TestCase):
    def setUp(self):
        self.cards = {'assess': {'anlamlar': [{'tr': 'değerlendirmek', 'ex': 'Assess it.', 'exTr': 'Onu değerlendir.', 'yz': 4}], 'puan': 40}}
        guard = {'tr': 'değerlendirmek', 'ex': 'Assess it.'}
        self.batch = {'schema_version': 1, 'corrections': [{'word': 'assess', 'sense_index': 0, 'expected': guard,
            'replacement': {'ex': 'Assess the evidence.', 'exTr': 'Kanıtları değerlendir.'}}],
            'enrichments': [{'word': 'assess', 'sense_index': 0, 'expected': guard,
            'alternatives': [{'ex': 'Assess the options.', 'exTr': 'Seçenekleri değerlendir.'}]}],
            'collocations': [{'word': 'assess', 'expected': [], 'replacement': [{'en': 'assess the impact', 'tr': 'etkiyi değerlendirmek'}]}]}

    def test_full_application(self):
        counts = uygula(self.cards, [self.batch])
        self.assertEqual(counts, {'corrections': 1, 'collocations': 1, 'alternatives': 1, 'removed_senses': 0})
        meaning = self.cards['assess']['anlamlar'][0]
        self.assertEqual(meaning['ex'], 'Assess the evidence.')
        self.assertEqual(meaning['exs'][0]['exTr'], 'Seçenekleri değerlendir.')
        self.assertEqual(meaning['yz'], 4)
        self.assertEqual(self.cards['assess']['puan'], 40)

    def test_stale_guard_atomic(self):
        before = deepcopy(self.cards)
        self.batch['collocations'][0]['expected'] = [{'en': 'old', 'tr': 'eski'}]
        with self.assertRaisesRegex(ValueError, 'stale collocation'):
            uygula(self.cards, [self.batch])
        self.assertEqual(self.cards, before)

    def test_wrong_sense(self):
        self.batch['enrichments'][0]['expected'] = {'tr': 'farklı anlam', 'ex': 'Assess it.'}
        with self.assertRaisesRegex(ValueError, 'stale editorial sense'):
            uygula(self.cards, [self.batch])

    def test_duplicate_operation(self):
        with self.assertRaisesRegex(ValueError, 'duplicate editorial'):
            uygula(self.cards, [self.batch, self.batch])

    def test_duplicate_example(self):
        self.batch['enrichments'][0]['alternatives'][0]['ex'] = 'Assess the evidence.'
        with self.assertRaisesRegex(ValueError, 'duplicates a main'):
            uygula(self.cards, [self.batch])

    def test_incomplete_translation(self):
        del self.batch['enrichments'][0]['alternatives'][0]['exTr']
        with self.assertRaisesRegex(ValueError, 'English/Turkish pair'):
            uygula(self.cards, [self.batch])

    def removal_fixture(self):
        last = {'tr': 'yanlış türemiş biçim', 'ex': 'A different form.', 'exTr': 'Farklı bir biçim.'}
        self.cards['assess']['anlamlar'].append(last)
        return {'schema_version': 1, 'removals': [{'word': 'assess', 'sense_index': 1,
            'expected_count': 2, 'expected': deepcopy(last)}]}

    def test_remove_only_wrong_last_sense_preserves_card_and_alternatives(self):
        removal = self.removal_fixture()
        counts = uygula(self.cards, [removal, self.batch])
        self.assertEqual(counts['removed_senses'], 1)
        self.assertEqual(list(self.cards), ['assess'])
        self.assertEqual(len(self.cards['assess']['anlamlar']), 1)
        self.assertEqual(self.cards['assess']['puan'], 40)
        self.assertEqual(self.cards['assess']['anlamlar'][0]['yz'], 4)
        self.assertEqual(self.cards['assess']['anlamlar'][0]['exs'][0]['ex'], 'Assess the options.')

    def test_removal_guards_are_atomic(self):
        for mutation in ('stale', 'count', 'partial', 'first', 'only', 'alternatives', 'duplicate'):
            with self.subTest(mutation=mutation):
                self.setUp()
                removal = self.removal_fixture()
                row = removal['removals'][0]
                if mutation == 'stale': row['expected']['exTr'] = 'Eski çeviri.'
                elif mutation == 'count': row['expected_count'] = 3
                elif mutation == 'partial': del row['expected']['exTr']
                elif mutation in ('first', 'only'):
                    row['sense_index'] = 0
                    row['expected'] = {key: self.cards['assess']['anlamlar'][0][key] for key in ('tr', 'ex', 'exTr')}
                    if mutation == 'only':
                        self.cards['assess']['anlamlar'].pop()
                        row['expected_count'] = 1
                elif mutation == 'alternatives':
                    self.cards['assess']['anlamlar'][1]['exs'] = [{'ex': 'Keep this.', 'exTr': 'Bunu koru.'}]
                elif mutation == 'duplicate': removal['removals'].append(deepcopy(row))
                before = deepcopy(self.cards)
                with self.assertRaises(ValueError): uygula(self.cards, [removal])
                self.assertEqual(self.cards, before)

    def test_removal_overlap_rejected_in_both_orders(self):
        for category in ('corrections', 'enrichments'):
            for reverse in (False, True):
                with self.subTest(category=category, reverse=reverse):
                    self.setUp()
                    removal = self.removal_fixture()
                    row = {key: value for key, value in removal['removals'][0].items() if key != 'expected_count'}
                    pair = {'ex': 'A replacement example.', 'exTr': 'Bir ikame örnek.'}
                    row['replacement' if category == 'corrections' else 'alternatives'] = pair if category == 'corrections' else [pair]
                    operation = {'schema_version': 1, category: [row]}
                    batches = [operation, removal] if reverse else [removal, operation]
                    before = deepcopy(self.cards)
                    with self.assertRaisesRegex(ValueError, 'overlaps'): uygula(self.cards, batches)
                    self.assertEqual(self.cards, before)


if __name__ == '__main__':
    unittest.main()
