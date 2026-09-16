# Manuscript figures

These images are rendered from the supplied survey's `figures/generated/` directory. Original artwork and annotations are retained. Page whitespace is cropped for the three method overviews; figures are not recolored or generated.

| Web asset | Source PDF | Export bounds at 1800 px page scale (x, y, width, height) |
| --- | --- | --- |
| pruning_figure.png | pruning_figure.pdf | 350, 175, 1140, 405 |
| runtime_overview_figure.png | runtime_overview_figure.pdf | 135, 325, 1500, 400 |
| optimization_figure.png | optimization_figure.pdf | 105, 280, 1500, 425 |
| optimization_results_b.png | optimization_results_b.pdf | Full page |

Use Poppler's `pdftoppm -png -singlefile -scale-to 1800`, with the `-x`, `-y`, `-W`, and `-H` crop options where applicable. Review exported images after changing the manuscript, since the layout and corresponding interactive hotspot coordinates may change.

The MASS chart in `interactions.js` is a separate interactive reconstruction. It uses the precise values in `sections/6_synthesis.tex`: 63.54 → 67.44 → 74.56 → 77.55 → 78.40. The original plotted labels are rounded to one decimal. These are sequential cumulative stages over eight tasks, not independent ablations.
