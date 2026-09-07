"""Exercise the actual generator functions without loading workbook libraries."""
import ast
import contextlib
import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parents[1] / 'listeyi-aktar.py'
tree = ast.parse(SOURCE.read_text(encoding='utf-8-sig'))


def production_function(name, namespace):
    function = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == name)
    exec(compile(ast.Module(body=[function], type_ignores=[]), str(SOURCE), 'exec'), namespace)
    return namespace[name]


class HeadwordSafety(unittest.TestCase):
    def guard(self, words, aliases=None, published=None):
        environment = {'sys': sys, 'yayimlanmis_adlari_oku': lambda file, _pattern:
                       set(published or ['alexander']) if file == 'kelime-dizin.js' else {'lead to'}}
        fn = production_function('silme_korumasi', environment)
        with contextlib.redirect_stdout(io.StringIO()):
            return fn(words, {'lead to': {}}, kelime_takma=aliases)

    def test_real_rename_preserves_record(self):
        self.assertEqual(self.guard({'alexanders': {}}, {'alexander': 'alexanders'}), 0)

    def test_missing_alias_still_blocks(self):
        with self.assertRaises(SystemExit):
            self.guard({'alexanders': {}})

    def test_missing_target_still_blocks(self):
        with self.assertRaises(SystemExit):
            self.guard({'other': {}}, {'alexander': 'alexanders'})

    def test_self_reference_still_blocks(self):
        with self.assertRaises(SystemExit):
            self.guard({'other': {}}, {'alexander': 'alexander'})

    def test_unrelated_loss_still_blocks(self):
        with self.assertRaises(SystemExit):
            self.guard({'alexanders': {}}, {'alexander': 'alexanders'}, ['alexander', 'abandon'])

    def test_old_score_key_is_explicit_and_validated(self):
        table = {'sema': 1, 'kayitlar': {'alexander': {'p': 13.8}, 'other': {'p': 20.1}}}
        environment = {'os': type('Os', (), {'path': type('P', (), {'exists': staticmethod(lambda _: True)})}),
                       'io': io, 'json': json, 'PUAN_GUNCELLEMESI': 'unused.json'}
        fn = production_function('puan_guncellemesini_uygula', environment)
        records = {'alexanders': {'puan': 5.1}, 'other': {'puan': 5.5}}
        correction = {'eskiler': ['alexander'], 'yeni': 'alexanders', 'puan_kaynak_basligi': 'alexander'}
        with patch.object(io, 'open', return_value=io.StringIO(json.dumps(table))):
            self.assertEqual(fn(records, baslik_duzeltmeleri=[correction]), 2)
        self.assertEqual(records['alexanders']['puan'], 13.8)
        self.assertEqual(records['other']['puan'], 20.1)
        for invalid in ['other', 'missing']:
            with patch.object(io, 'open', return_value=io.StringIO(json.dumps(table))):
                with self.assertRaises(ValueError):
                    fn(records, baslik_duzeltmeleri=[dict(correction, puan_kaynak_basligi=invalid)])


if __name__ == '__main__':
    unittest.main()
