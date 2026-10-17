"""Final usage overlay: complete coverage, guard failures and atomicity."""
from copy import deepcopy
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from kalip_anlamlari import uygula


class UsageTest(unittest.TestCase):
    def setUp(self):
        self.cards = {'establish': {'anlamlar': [{'tr': 'kurmak', 'ex': 'Kept example.'}, {'tr': 'saptamak'}],
                                    'kalip': [{'en': 'establish a company', 'tr': 'şirket kurmak'}], 'puan': 60.8}}
        self.row = {'word': 'establish', 'expected_senses': ['kurmak', 'saptamak'],
                    'expected': deepcopy(self.cards['establish']['kalip']),
                    'replacement': [{'en': 'establish a company', 'tr': 'şirket kurmak'},
                                    {'en': 'establish the cause', 'tr': 'nedeni saptamak'},
                                    {'en': 'establish that…', 'tr': '… olduğunu ortaya koymak'},
                                    {'en': 'establish whether…', 'tr': '… olup olmadığını saptamak'}],
                    'sense_coverage': [[0], [1], [1], [1]]}

    def test_variable_count_and_preservation(self):
        before = deepcopy(self.cards)
        result = uygula(self.cards, [self.row])
        self.assertEqual(result, {'words': 1, 'patterns': 4})
        self.assertEqual(self.cards['establish']['kalip'], self.row['replacement'])
        self.assertEqual(self.cards['establish']['anlamlar'], before['establish']['anlamlar'])
        self.assertEqual(self.cards['establish']['puan'], 60.8)

    def rejection_preserves_source(self, rows):
        before = deepcopy(self.cards)
        with self.assertRaises(ValueError):
            uygula(self.cards, rows)
        self.assertEqual(self.cards, before)

    def test_stale_meaning(self):
        self.row['expected_senses'][1] = 'different'
        self.rejection_preserves_source([self.row])

    def test_stale_phrase(self):
        self.row['expected'] = []
        self.rejection_preserves_source([self.row])

    def test_missing_meaning_coverage(self):
        self.row['sense_coverage'] = [[0], [], [], []]
        self.rejection_preserves_source([self.row])

    def test_invalid_sense_index(self):
        self.row['sense_coverage'][1] = [True]
        self.rejection_preserves_source([self.row])

    def test_missing_word(self):
        self.rejection_preserves_source([])

    def test_duplicate_word_after_valid_row_is_atomic(self):
        self.rejection_preserves_source([self.row, self.row])

    def test_duplicate_phrase(self):
        self.row['replacement'].append(deepcopy(self.row['replacement'][0]))
        self.row['sense_coverage'].append([0])
        self.rejection_preserves_source([self.row])

    def test_empty_translation(self):
        self.row['replacement'][0]['tr'] = ''
        self.rejection_preserves_source([self.row])


if __name__ == '__main__':
    unittest.main()
