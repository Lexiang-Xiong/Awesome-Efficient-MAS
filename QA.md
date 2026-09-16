# Validation record

Validated locally on 2026-09-16.

## Abstract removal — 2026-09-17

- Removed all abstract expanders and unavailable-abstract notices at the authors' request. Removed the unused abstract cache, importer, styles, and page dependency.
- Paper metadata, source links, evidence details, category filtering, and pagination remain available. The abstract checks below describe the previous revision and no longer apply to the current interface.

## Library and chart regression checks — 2026-09-17

- Reproduced atlas navigation to the six Continual Learning papers, then verified that Topology resets stale search/year/evidence filters and returns 27 papers. All papers returns 256; Show all renders all 256 cards.
- Default pagination shows 25 entries and explicit result ranges. Node regression checks cover every category's total, stale filters, page clamping, all 256 entries across pages without duplicates, whitespace queries, and empty results. These checks now run with the Pages validation command.
- Added 249 source-verified abstracts, expandable inline with provenance links. Seven unavailable abstracts are explicitly marked rather than inferred. Cached JSON and JavaScript must match during validation.
- Reduced MASS point radius from 7 to 5 and halo radius from 22 to 11. Marker and halo styling are separated; the selected halo is translucent with no solid white border. Large pointer hit targets remain unchanged.
- Verified desktop and 390 × 844 mobile interactions and abstract layouts with no horizontal overflow. Browser console was free of errors during these checks.
- Updated the citation to the requested preprint template with empty journal and eprint fields; no arXiv identifier has been assigned according to the authors.

## Panel cropping and citation revision

- Replaced whole-image scaling with SVG viewports cropped to the selected panel. Each viewport follows its panel's aspect ratio; the topology feedback label uses a shaped clip so adjacent artwork is excluded without losing the label.
- Checked all 11 panels for correct viewport bounds, displayed aspect ratio, hidden overview, and click-to-restore behavior. Checked keyboard Enter activation and Escape restoration.
- Checked desktop (1440 × 1000) and mobile (390 × 844) layouts. Mobile panel and citation views have no horizontal page overflow.
- The homepage displays the survey's manuscript BibTeX and a copy button, replacing the bibliography download and paper-suggestion invitation. Publication year and identifiers remain unset pending confirmation.
- The copy button reports success; an actual paste into the local search input verified the citation was copied. The input was cleared after verification. Clipboard fallback behavior is implemented but was not separately forced during browser checks.

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
