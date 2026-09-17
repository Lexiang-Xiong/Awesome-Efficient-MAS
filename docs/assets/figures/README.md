# Manuscript figures

The three method overviews now use the author's 15360 × 8640 JPEG exports supplied on 2026-09-17. Page whitespace is cropped without resampling. Extra black dashed separator rules in Topology were precisely masked in the white gutters, with the author's approval; all pixels outside those masks are unchanged. Text, arrows, colors, and diagram content are retained. PNGs preserve the cropped pixels; the webpage uses pixel-identical lossless WebP copies. Full-screen viewing and downloads use the PNGs.

| Current asset | Native cropped dimensions |
| --- | --- |
| pruning_figure.png / .webp | 9503 × 3203 |
| runtime_overview_figure.png / .webp | 12526 × 3248 |
| optimization_figure.png / .webp | 12787 × 3434 |

`scripts/prepare_author_figures.py` records the crop and mask coordinates and verifies pixel preservation outside the masks and in the WebP copies. Its inputs are the three original JPEGs in Topology, Runtime, Optimization order. Interactive clipping bounds use the new artwork's logical coordinates in `docs/interactions.js`.

The older PDF export bounds below are retained for provenance; the MASS chart still uses its original PDF export.

| Web asset | Source PDF | Export bounds at 1800 px page scale (x, y, width, height) |
| --- | --- | --- |
| pruning_figure.png | pruning_figure.pdf | 350, 175, 1140, 405 |
| runtime_overview_figure.png | runtime_overview_figure.pdf | 135, 325, 1500, 400 |
| optimization_figure.png | optimization_figure.pdf | 105, 280, 1500, 425 |
| optimization_results_b.png | optimization_results_b.pdf | Full page |

Use Poppler's `pdftoppm -png -singlefile -scale-to 1800`, with the `-x`, `-y`, `-W`, and `-H` crop options where applicable. Review exported images after changing the manuscript, since the layout and corresponding interactive hotspot coordinates may change.

The MASS chart in `interactions.js` is a separate interactive reconstruction. It uses the precise values in `sections/6_synthesis.tex`: 63.54 → 67.44 → 74.56 → 77.55 → 78.40. The original plotted labels are rounded to one decimal. These are sequential cumulative stages over eight tasks, not independent ablations.
