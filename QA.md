# Validation record

Validated locally on 2026-09-16.

- The importer resolved all active manuscript citation keys: 256 unique works from 272 bibliography entries. Uncited entries are not counted in the website collection.
- All 29 representative methods were extracted from the manuscript evidence table, including primary family, reported effect, update timing, evidence coverage, and main boundary.
- JSON and browser JavaScript datasets agree. The downloadable BibTeX contains the same 256 cited keys.
- All local HTML assets and fragment targets resolve. JavaScript syntax checks pass. The public directory contains no manuscript source, archive, environment file, or supplied font binaries.
- Browser checks passed for dense (21 links), sparse (9 links), and routed (4 links) graphs; taxonomy switching; keyboard tab navigation; category-to-library navigation; title/method search; empty results; evidence expansion; year filtering; sorting controls; reset; and pagination.
- The evidence-only filter returns 29 papers. The Runtime section filter returns 116 papers. The 2024 year filter returns 51 papers. These section counts are citation placement, not mutually exclusive primary-method counts.
- Desktop (1440 × 1000) and mobile (390 × 844) layouts were checked. No horizontal overflow was detected. No browser console errors were recorded during interaction checks.
- The normalized MAPGD bars share a 0–150% scale and mark the ProTeGi baseline at 100%. The graph is explicitly illustrative and does not claim measured savings.

Not verified: live deployment, GitHub Actions execution, and network reachability of every bibliography link. The one missing ProTeGi URL was matched against the official ACL Anthology entry and recorded in `metadata-overrides.json`. Publication metadata remains to be confirmed.
