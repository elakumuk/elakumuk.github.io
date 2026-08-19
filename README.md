# elakumuk.com — personal site

A single static page. No framework, no build step: open `index.html` and it runs.

```
index.html      markup
styles.css      design tokens + layout (light/dark, both hand-specified)
app.js          charts, the interactive guard demo, the hero canvas
assets/         drawings, product demo video, social card
```

## The figures are real

Three of the charts are built from actual project output, embedded as data in `app.js`:

| Figure | Source |
|---|---|
| Massachusetts crash outcomes | MassDOT IMPACT open crash data, feature services 2021–2025, aggregated with the same KSI and road-user rules the original project uses |
| H-1B sub-category scatter | `subcategory_breakdown.csv` from the BUS240F difference-in-differences pipeline |
| Method comparison | OLS / naive / PSM estimates from the Marketing Analytics report |

Nothing on the page is illustrative data dressed up as a result. Where a figure *is* an
illustration — the Ovrule `guard()` demo — its caption says so.

## Accessibility and theming

- Light and dark are both designed, not inverted. Every colour is a token defined on bare
  `:root`, redefined under `prefers-color-scheme` and `[data-theme]`, so the page holds up in
  all three viewer states.
- Series colours were checked for colour-vision separation and contrast against both surfaces.
- Every chart has a table view; motion respects `prefers-reduced-motion`.

## Local

```bash
python3 -m http.server 8000    # then open http://localhost:8000
```

## Deploy

Static. Vercel serves it as-is with no configuration.
