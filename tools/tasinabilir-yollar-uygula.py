"""One-time mechanical migration of legacy absolute Python path literals."""
import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
changed = []
for file in (ROOT / 'tools').rglob('*.py'):
    if file.name in {'tasinabilir-yollar-uygula.py', 'yds_paths.py'}:
        continue
    source = file.read_text(encoding='utf-8')
    tree = ast.parse(source)
    lines = source.splitlines(keepends=True)
    starts = [0]
    for line in lines:
        starts.append(starts[-1] + len(line))
    edits = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.Constant) or not isinstance(node.value, str):
            continue
        value = node.value.replace('\\', '/')
        if '\n' in value or not value.startswith('C:/Users/Trk/'):
            continue
        if value.startswith('C:/Users/Trk/Desktop/YDS/04_Github'):
            suffix = value[len('C:/Users/Trk/Desktop/YDS/04_Github'):].strip('/')
            function = 'site_path'
        elif value.startswith('C:/Users/Trk/Desktop/YDS/'):
            suffix = value[len('C:/Users/Trk/Desktop/YDS/'):]
            function = 'yds_path'
        elif '/scratchpad/' in value:
            suffix = value.split('/scratchpad/', 1)[1]
            function = 'scratch_path'
        else:
            continue
        # AST columns are UTF-8 byte offsets; source slicing uses characters.
        start = starts[node.lineno-1] + len(lines[node.lineno-1].encode()[:node.col_offset].decode())
        end = starts[node.end_lineno-1] + len(lines[node.end_lineno-1].encode()[:node.end_col_offset].decode())
        replacement = function + '(' + ', '.join(repr(p) for p in suffix.split('/') if p) + ')'
        edits.append((start, end, replacement))
    if not edits:
        continue
    for start, end, replacement in sorted(edits, reverse=True):
        source = source[:start] + replacement + source[end:]
    tree = ast.parse(source)
    insertion = 0
    for i, node in enumerate(tree.body):
        if (i == 0 and isinstance(node, ast.Expr) and isinstance(node.value, ast.Constant) and isinstance(node.value.value, str)) or (isinstance(node, ast.ImportFrom) and node.module == '__future__'):
            insertion = node.end_lineno
        else:
            break
    bootstrap = '\nfrom pathlib import Path as _YdsPath\nimport sys as _yds_sys\n_yds_site = next(p for p in _YdsPath(__file__).resolve().parents if (p / "sw.js").is_file())\n_yds_sys.path.insert(0, str(_yds_site / "tools"))\nfrom yds_paths import site_path, yds_path, scratch_path\n'
    parts = source.splitlines(keepends=True)
    source = ''.join(parts[:insertion]) + bootstrap + ''.join(parts[insertion:])
    ast.parse(source)
    file.write_text(source, encoding='utf-8', newline='\n')
    changed.append((str(file.relative_to(ROOT)), len(edits)))
print(changed)
