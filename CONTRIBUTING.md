# Contributing

We welcome relevant papers, taxonomy corrections, and more complete evidence accounting.

1. Open a paper suggestion issue with the title, authors, year, and stable URL.
2. Explain why it belongs in the survey and which object it controls.
3. For efficiency claims, include the original baseline, task, quality metric, resource measure, and accounting boundary. Distinguish reported results from derived quantities.
4. Do not convert paper-specific percentages into a universal ranking.

The manuscript is the source of truth. Update its bibliography and active section citations, then run `scripts/sync_survey.py --source PATH`. This regenerates the website dataset and README together. Do not edit only the generated JavaScript copy.

Verified metadata supplements belong in `metadata-overrides.json`, with the authoritative source and reason recorded. The original downloadable BibTeX remains faithful to the manuscript; website supplements are identified in each dataset record's `metadataSource` field.

Section tags describe citation placement; the representative-method table preserves primary classification from the manuscript. Cross-section citations are expected and do not create additional unique papers.

For website changes, keep relative asset paths so the site works under a GitHub project subpath. Check keyboard navigation, search, filters, empty results, pagination, and mobile layout. Respect reduced-motion preferences and retain the explicit distinction between illustrative graphs and measured evidence.

Author information and publication links must be confirmed before updating. Do not add guessed arXiv identifiers, GitHub repository URLs, or licensing terms.
