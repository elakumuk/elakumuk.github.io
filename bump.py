#!/usr/bin/env python3
"""Stamp styles.css and app.js with a content hash so a changed file can never
be served from a stale cache. GitHub Pages sends max-age=600, which is long
enough for a deploy to look broken. Run this before every commit."""
import hashlib, re, pathlib

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text()

for name, pat in [("styles.css", r'href="styles\.css(?:\?v=[0-9a-f]+)?"'),
                  ("app.js",     r'src="app\.js(?:\?v=[0-9a-f]+)?"')]:
    h = hashlib.md5((root / name).read_bytes()).hexdigest()[:8]
    attr = "href" if name.endswith(".css") else "src"
    html = re.sub(pat, f'{attr}="{name}?v={h}"', html)
    print(f"{name} -> ?v={h}")

(root / "index.html").write_text(html)
