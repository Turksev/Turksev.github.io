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
        self.assertEqual(counts, {'corrections': 1, 'collocations': 1, 'alternatives': 1})
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


if __name__ == '__main__':
    unittest.main()
