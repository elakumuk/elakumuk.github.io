#!/usr/bin/env python3
"""Stamp shared assets on the homepage and case pages after every change."""
import hashlib
import pathlib
import re

root = pathlib.Path(__file__).parent
for page in [root / 'index.html', *sorted((root / 'cases').glob('*.html'))]:
    html = page.read_text()
    for name in ['design.css', 'styles.css', 'app.js']:
        digest = hashlib.sha256((root / name).read_bytes()).hexdigest()[:8]
        attr = 'src' if name.endswith('.js') else 'href'
        pattern = rf'{attr}="(/?){re.escape(name)}(?:\?v=[0-9a-f]+)?"'
        html = re.sub(pattern, lambda m: f'{attr}="{m[1]}{name}?v={digest}"', html)
    page.write_text(html)
print('Stamped shared assets on homepage and all case pages.')
