# Validation record

Validated locally on 2026-09-16.

## Blue interactive revision

- Added a blue theme, navigation progress, and reduced-motion-aware transitions.
- The graph supports pointer dragging, keyboard movement, agent inspection, disabling/enabling agents, three presets, and an adjustable communication budget. Budget endpoints return 0 and 21 active links for the complete seven-agent team. Disabling the planner in the sparse preset leaves 7 links; reset restores 9.
- The three original method figures contain 11 focusable/clickable regions. Region selection reveals the corresponding explanation and related-paper filter. A native dialog provides zoom, pan, download, Escape dismissal, and restored opener focus.
- MASS stage selection uses exact manuscript values: 63.54, 67.44, 74.56, 77.55, 78.40. The final cumulative gain is 14.86 points. Values are not interpolated into fabricated experiments.
- Checked desktop and mobile layouts, including mobile viewer sizing, keyboard range input, stage clicks, region focus, and dialog focus return. No horizontal overflow or browser console errors were observed in those checks.
- Original figure artwork is retained, with only PDF page whitespace removed during export. Source files and bounds are documented with the image assets.

## Original collection validation

- The importer resolved all active manuscript citation keys: 256 unique works from 272 bibliography entries. Uncited entries are not counted in the website collection.
- All 29 representative methods were extracted from the manuscript evidence table, including primary family, reported effect, update timing, evidence coverage, and main boundary.
- JSON and browser JavaScript datasets agree. The downloadable BibTeX contains the same 256 cited keys.
- All local HTML assets and fragment targets resolve. JavaScript syntax checks pass. The public directory contains no manuscript source, archive, environment file, or supplied font binaries.
- Browser checks passed for dense (21 links), sparse (9 links), and routed (4 links) graphs; taxonomy switching; keyboard tab navigation; category-to-library navigation; title/method search; empty results; evidence expansion; year filtering; sorting controls; reset; and pagination.
- The evidence-only filter returns 29 papers. The Runtime section filter returns 116 papers. The 2024 year filter returns 51 papers. These section counts are citation placement, not mutually exclusive primary-method counts.
- Desktop (1440 × 1000) and mobile (390 × 844) layouts were checked. No horizontal overflow was detected. No browser console errors were recorded during interaction checks.
- The normalized MAPGD bars share a 0–150% scale and mark the ProTeGi baseline at 100%. The graph is explicitly illustrative and does not claim measured savings.

Not verified: live deployment, GitHub Actions execution, and network reachability of every bibliography link. The one missing ProTeGi URL was matched against the official ACL Anthology entry and recorded in `metadata-overrides.json`. Publication metadata remains to be confirmed.
