# Contributing

We welcome relevant papers, taxonomy corrections, and more complete evidence accounting.

1. Open a paper suggestion issue with the title, authors, year, and stable URL.
2. Explain why it belongs in the survey and which object it controls.
3. For efficiency claims, include the original baseline, task, quality metric, resource measure, and accounting boundary. Distinguish reported results from derived quantities.
4. Do not convert paper-specific percentages into a universal ranking.

For manuscript references, update its bibliography and active section citations, then run `scripts/sync_survey.py --source PATH`. This regenerates the website dataset and README together. Do not edit only the generated JavaScript copy.

For subsequent project-page additions, add a BibTeX entry to `supplemental-papers.bib` and its topic tags and metadata source to `supplemental-papers.json` under the same key. The importer merges these into the existing collection and downloadable bibliography. It preserves their separate provenance, excludes them from the manuscript citation count and evidence table, and avoids duplicating a work once it appears in the manuscript. Use the first publication year for sorting; record later revisions in the BibTeX note.

Verified metadata supplements belong in `metadata-overrides.json`, with the authoritative source and reason recorded. The original downloadable BibTeX remains faithful to the manuscript; website supplements are identified in each dataset record's `metadataSource` field.

Topic tags indicate relevance. For manuscript references they retain citation placement; for subsequent additions they are assigned editorially. Method-family tags may indicate related reading without treating a paper as a representative method. The representative-method table preserves primary classification from the manuscript. Overlapping tags do not create additional unique papers.

For website changes, keep relative asset paths so the site works under a GitHub project subpath. Check keyboard navigation, search, filters, empty results, pagination, and mobile layout. Respect reduced-motion preferences and retain the explicit distinction between illustrative graphs and measured evidence.

Interactive behavior is in `docs/interactions.js`, with the blue visual system in `docs/interactions.css`. Graph controls must report actual active connections and never imply a measured quality gain. Figure hotspot geometry must be checked against the exported assets. MASS values must remain tied to the survey's ordered, cumulative optimization stages. All hover explanations must remain accessible through focus or tap; full-screen viewers must support Escape and return focus to the opener.

Author information and publication links must be confirmed before updating. Do not add guessed arXiv identifiers, GitHub repository URLs, or licensing terms.
