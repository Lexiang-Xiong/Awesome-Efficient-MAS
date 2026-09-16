"""Export active LaTeX citations, section membership and the evidence table.

Uses only Python's standard library. Does not upload the manuscript.
Usage: python scripts/sync_survey.py --source /path/to/manuscript
"""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
CITE = re.compile(r"\\cite\w*\*?(?:\[[^\]]*\])*\{([^}]+)\}")

def active(text):
    return re.sub(r"(?<!\\)%[^\n]*", "", text)

def balanced(text, start):
    depth = 0
    for end in range(start, len(text)):
        if text[end] == "{" and (end == 0 or text[end-1] != "\\"):
            depth += 1
        elif text[end] == "}" and (end == 0 or text[end-1] != "\\"):
            depth -= 1
            if depth == 0:
                return text[start+1:end], end+1
    raise ValueError("Unbalanced BibTeX braces")

def clean(value):
    for latex, char in [(r"\times", "×"), (r"\tau", "τ"), (r"\infty", "∞")]:
        value = value.replace(latex, char)
    accents = {"'": "\u0301", "^": "\u0302", '`': "\u0300", '"': "\u0308", '~': "\u0303"}
    value = re.sub(r'''\\(['^`"~])\{?([A-Za-z])\}?''', lambda m: unicodedata.normalize('NFC', m[2] + accents[m[1]]), value)
    value = value.replace("$", "")
    value = re.sub(r"\\(?:textit|textbf|emph|url)\{([^{}]*)\}", r"\1", value)
    value = value.replace(r"\&", "&").replace(r"\_", "_").replace(r"\%", "%")
    value = value.replace("---", "—").replace("--", "–").replace("~", " ")
    value = value.replace("{", "").replace("}", "")
    return " ".join(value.split())

def parse_bib(text):
    entries = {}
    for match in re.finditer(r"@(\w+)\s*\{\s*([^,\s]+)\s*,", text):
        body, end = balanced(text, text.index("{", match.start()))
        key, fields_text = body.split(",", 1)
        fields = {}
        offset = 0
        while offset < len(fields_text):
            field = re.search(r"(\w+)\s*=\s*", fields_text[offset:])
            if not field:
                break
            name = field.group(1).lower()
            start = offset + field.end()
            if fields_text[start] == "{":
                value, offset = balanced(fields_text, start)
            elif fields_text[start] == '"':
                finish = start + 1
                while finish < len(fields_text):
                    if fields_text[finish] == '"' and fields_text[finish-1] != "\\":
                        break
                    finish += 1
                value, offset = fields_text[start+1:finish], finish+1
            else:
                finish = fields_text.find(",", start)
                if finish < 0:
                    finish = len(fields_text)
                value, offset = fields_text[start:finish], finish+1
            fields[name] = clean(value)
        if key in entries:
            raise ValueError(f"Duplicate bibliography key: {key}")
        entries[key] = (fields, text[match.start():end])
    return entries

def citations(text):
    return {key.strip() for match in CITE.finditer(text) for key in match.group(1).split(",")}

def collect(source):
    entries = parse_bib((source / "references.bib").read_text(encoding="utf-8"))
    main = active((source / "main.tex").read_text(encoding="utf-8"))
    paths = [source / (name + ".tex") for name in re.findall(r"\\input\{([^}]+)\}", main)]
    cited = citations(main)
    membership, subfamilies, locations = {}, {}, {}
    evidence = {}
    overrides = json.loads((ROOT / "metadata-overrides.json").read_text(encoding="utf-8"))
    for path in paths:
        text = active(path.read_text(encoding="utf-8"))
        keys = citations(text)
        cited |= keys
        for key in keys:
            locations.setdefault(key, set()).add(path.relative_to(source).as_posix())
        if path.name == "4_1_topology.tex":
            table = text[:text.index(r"\subsection{Topology}")]
            family = "Topology"
            for row in table.split(r"\\"):
                if r"\Rbadge" in row:
                    family = "Runtime"
                if r"\Obadge" in row:
                    family = "Optimization"
                match = re.search(r"([A-Za-z]+)\s*&\s*([^&\n]+?)~?\\cite\{([^}]+)\}\s*&\s*([^&]+)&\s*([^&]+)&\s*(\\[fe]star)\s*&\s*(\\[fe]star)\s*&\s*(\\[fe]star)\s*&\s*(\\[fe]star)\s*&\s*(.+)", row, re.S)
                if not match:
                    continue
                sub, method, key, update, effect, *rest = match.groups()
                evidence[key] = {"method": clean(method.rstrip("~")), "family": family, "subfamily": sub,
                    "update": clean(update), "effect": clean(effect), "boundary": clean(rest[-1]),
                    "quantified": [label for flag, label in zip(rest[:4], ["Paired outcome (Q)", "Measured deployment use (R)", "Offline cost included (O)", "Cross-setting evaluation (X)"]) if flag == r"\fstar"]}
            text = text[text.index(r"\subsection{Topology}"):]
        # Section membership is provenance, not inferred primary-method classification.
        section = {"4_1_topology.tex":"Topology", "4_2_runtime.tex":"Runtime", "4_3_optimization.tex":"Optimization"}.get(path.name, "")
        sub = ""
        tokens = re.compile(r"\\(section|subsection|subsubsection)\{([^}]+)\}|" + CITE.pattern)
        for match in tokens.finditer(text):
            level, heading, citekeys = match.groups()
            if level:
                if level == "section":
                    section, sub = {"Evidence Synthesis": "Synthesis"}.get(heading, heading), ""
                elif level == "subsubsection":
                    sub = heading
                elif not section:
                    section = heading
            else:
                for key in map(str.strip, citekeys.split(",")):
                    if section and section != "Efficiency Methods":
                        membership.setdefault(key, set()).add(section)
                    if sub and section in ("Topology", "Runtime", "Optimization"):
                        subfamilies.setdefault(key, set()).add(section + " / " + sub)
    missing = sorted(cited - entries.keys())
    if missing:
        raise ValueError("Active citations missing from bibliography: " + ", ".join(missing))
    order = ["Topology", "Runtime", "Optimization", "Collaboration Boundary", "Background", "Foundations", "Evaluation", "Synthesis", "Open Problems", "Introduction", "Conclusion"]
    papers = []
    for key in sorted(cited):
        fields, _ = entries[key]
        ev = evidence.get(key)
        cats = membership.get(key, set())
        if ev:
            cats.add(ev["family"])
        year = re.search(r"\d{4}", fields.get("year", ""))
        url = fields.get("url", "")
        if not url and fields.get("doi"):
            url = "https://doi.org/" + fields["doi"]
        if not url and fields.get("eprint"):
            url = "https://arxiv.org/abs/" + fields["eprint"]
        override = overrides.get(key, {})
        url = override.get("url", url)
        authors = " and ".join(" ".join(reversed(name.split(", ", 1))) if ", " in name else name for name in fields.get("author", "").split(" and "))
        papers.append({"key": key, "title": fields.get("title", key), "authors": authors,
            "year": int(year.group()) if year else None, "url": url,
            "venue": fields.get("booktitle", fields.get("journal", fields.get("note", ""))),
            "categories": sorted(cats, key=lambda c: order.index(c) if c in order else 99),
            "subfamilies": sorted(subfamilies.get(key, set())), "sourceFiles": sorted(locations.get(key, set())),
            "method": ev["method"] if ev else "", "evidence": ev, "metadataSource": override.get("source", "Manuscript bibliography")})
    digest = hashlib.sha256()
    for path in sorted(set(paths + [source / "main.tex", source / "references.bib"])):
        digest.update(path.relative_to(source).as_posix().encode())
        digest.update(path.read_bytes())
    result = {"title": "Efficiency in LLM Multi-Agent Systems: A Survey", "generatedFrom": "Active citations in the supplied LaTeX manuscript", "sourceSHA256": digest.hexdigest(),
        "classification": "Section tags record citation placement, not exclusive primary-method classification. Evidence-table methods retain the manuscript's primary family.",
        "stats": {"cited": len(papers), "bibEntries": len(entries), "evidenceMethods": len(evidence), "bySection": dict(Counter(c for p in papers for c in p["categories"]))}, "papers": papers}
    destination = ROOT / "docs/data"
    destination.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    (destination / "papers.json").write_text(payload, encoding="utf-8")
    (destination / "papers.js").write_text("window.SURVEY_DATA = " + payload.rstrip() + ";\n", encoding="utf-8")
    (destination / "references.bib").write_text("\n\n".join(entries[key][1] for key in sorted(cited)) + "\n", encoding="utf-8")
    write_readme(result)
    print(json.dumps(result["stats"], indent=2))

def md(value):
    return str(value).replace("|", r"\|").replace("<", "&lt;").replace(">", "&gt;").replace("[", r"\[").replace("]", r"\]")

def write_readme(data):
    papers = data["papers"]
    lines = ["<div align=\"center\">", "", "# Efficiency in LLM Multi-Agent Systems", "", "### A Survey · More intelligence. Less overhead.", "",
        "**Qi Li*** · **Lexiang Xiong*** · **Haiquan Lu*** · Wenjie Qu · Xingyi Yang · Jiaheng Zhang · Xinchao Wang", "",
        "National University of Singapore · University of California, Berkeley · The Hong Kong Polytechnic University", "", "<sub>* Equal contribution</sub>", "",
        f"**{len(papers)} cited works** &nbsp; / &nbsp; **3 control points** &nbsp; / &nbsp; **11 method families**", "",
        "[Explore the website source](docs/index.html) · [Bibliography](docs/data/references.bib) · [Paper dataset](docs/data/papers.json) · [Contribute](CONTRIBUTING.md)", "", "</div>", "",
        "> When does the benefit of collaboration justify its end-to-end resource cost?", "",
        "LLM multi-agent systems broaden search and combine evidence, but introduce repeated inference, growing message histories, and coordination overhead. This survey connects quality gains to their complete resource cost: first identifying the **collaboration boundary**, then organizing methods by **Topology**, **Runtime**, and **Optimization**.", "",
        "## At a glance", "", "| Control point | What changes | Method families |", "| --- | --- | --- |",
        "| **Topology** | Participating agents and communication structure | Pruning · Construction · Adaptation |",
        "| **Runtime** | Information, models, state, and work activated per request | Communication · Routing · State · Scheduling |",
        "| **Optimization** | Reusable configurations learned through search or training | Prompt optimization · Workflow search · Policy learning · Continual learning |", "",
        "```mermaid", "flowchart LR", '  B["Collaboration boundary<br/>Decomposition · Information · Escalation"] --> T[Topology]', '  B --> R[Runtime]', '  B --> O[Optimization]', '  T --> E["Evaluation<br/>Quality × realized resources × lifecycle cost"]', '  R --> E', '  O --> E', '  E --> S["Synthesis & open problems"]', '  style T fill:#85baff,color:#070d1c,stroke:#448aff', '  style R fill:#78d6fa,color:#070d1c,stroke:#3c91bc', '  style O fill:#b8bbff,color:#070d1c,stroke:#777bca', "```", "",
        "## Reading guide", "", "- [Representative methods](#representative-methods)", "- [Paper collection](#paper-collection)", "- [Evaluation perspective](#evaluation-perspective)", "- [Open problems](#open-problems)", "- [Run and publish](#run-and-publish)", "",
        "## Representative methods", "", f"The manuscript's evidence table covers **{data['stats']['evidenceMethods']} methods**. Reported effects describe the measured coordinates, not a guarantee of improvement on every resource or workload. Expand a method on the website for its evidence coverage.", "", "| Family | Method | Reported effect | Main boundary |", "| --- | --- | --- | --- |"]
    for p in sorted((p for p in papers if p["evidence"]), key=lambda p:(['Topology','Runtime','Optimization'].index(p['evidence']['family']),p['evidence']['subfamily'],p['method'])):
        e=p['evidence']; method=f"[{md(p['method'])}]({p['url']})" if p['url'] else md(p['method'])
        lines.append(f"| {e['family']} / {e['subfamily']} | {method} | {md(e['effect'])} | {md(e['boundary'])} |")
    lines.extend(["", "## Paper collection", "", "Generated from active citations in the supplied manuscript. Section membership records **where a paper is cited**; it does not assign all references to an exclusive method category. A paper may appear in multiple sections. Publication years and links are copied from the bibliography and are not a live metadata feed.", ""])
    for category in ["Topology", "Runtime", "Optimization", "Collaboration Boundary", "Background", "Foundations", "Evaluation", "Synthesis", "Open Problems", "Introduction", "Conclusion"]:
        selected=sorted((p for p in papers if category in p['categories']), key=lambda p:(-(p['year'] or 0),p['title']))
        if not selected: continue
        lines.extend([f"<details>", f"<summary><b>{category}</b> · {len(selected)} papers</summary>", "", "| Year | Paper & authors |", "| --- | --- |"])
        for p in selected:
            title=f"[{md(p['title'])}]({p['url']})" if p['url'] else md(p['title'])
            authors=p['authors'].split(' and ')
            by=', '.join(authors[:5])+(', et al.' if len(authors)>5 else '')
            lines.append(f"| {p['year'] or '—'} | {title}<br><sub>{md(by)}</sub> |")
        lines.extend(["", "</details>", ""])
    lines.extend(["## Evaluation perspective", "", "Efficiency is a quality–resource trade-off. Use matched baselines, measure realized consumption, and include the lifecycle costs of building and maintaining a configuration.", "", "For example, the survey reports that MAPGD reduces calls from 962 to 643 and tokens from 256k to 236k relative to ProTeGi under a 50-query protocol, while F1 rises from 0.83 to 0.87. Wall time increases from 159.4 to 201.5 seconds. These are paper-specific comparisons, not a cross-paper ranking.", "", "## Open problems", "", "1. **Comparable evaluation:** common budgets, baselines, and uncertainty-aware quality–resource curves.", "2. **Adaptive control:** request- and step-level decisions to continue, escalate, or stop.", "3. **Transfer under drift:** preserving gains as models, tools, and workloads change.", "4. **Causal attribution:** separating the effects of topology, prompts, information, and compute.", "5. **End-to-end cost:** including serving state, tools, recovery, defenses, and maintenance.", "",
        "## Publication and citation", "", "The supplied manuscript has no confirmed public survey URL or publication identifier. Its existing `BadWAM` links refer to a different project and are deliberately not reused here. Add the confirmed survey URL to `docs/data/site.js` and the final BibTeX citation here when available. Author order and affiliations currently follow `main.tex`.", "",
        "## Run and publish", "", "The site is plain HTML, CSS, and JavaScript, with no npm dependencies or build step.", "", "```bash", "python -m http.server 4173 --directory docs", "```", "", "Open http://localhost:4173. You can also open `docs/index.html` directly; the dataset is included as a local script.", "", "To refresh the collection from a revised manuscript:", "", "```bash", 'python scripts/sync_survey.py --source "/path/to/manuscript"', "python scripts/validate.py", "```", "", "The importer rebuilds `docs/data/papers.json`, `docs/data/papers.js`, `docs/data/references.bib`, and this README. Keep ongoing editorial notes in separate files so regeneration does not overwrite them.", "", "See [DEPLOYMENT.md](DEPLOYMENT.md) for GitHub repository creation and GitHub Pages deployment. The included workflow deploys only `docs/`. Manuscript sources, local files, and development scripts are not part of the public website.", "", "## Contributing", "", "See [CONTRIBUTING.md](CONTRIBUTING.md). Relevant papers, taxonomy corrections, and evidence-accounting updates are welcome. Please include a stable paper URL and identify the claim or category being corrected.", "", "## Acknowledgements", "", "Presentation references: [World Action Models](https://world-action-models.github.io/) and [Awesome VLA Safety](https://github.com/LiQiiiii/Awesome-VLA-Safety). This site's implementation and visual design were created independently for the MAS efficiency survey.", "", "## Reuse", "", "Publication and licensing terms are to be confirmed by the survey authors. No license to third-party papers or their figures is implied by inclusion in this bibliography.", ""])
    feature_index = lines.index("## At a glance")
    lines[feature_index:feature_index] = [
        "## Interactive homepage", "",
        "- **Collaboration playground:** drag agents, trace their connections, adjust the link budget, or disable a participant. This diagram is illustrative, not an efficiency benchmark.",
        "- **Visual atlas:** explore three original manuscript figures through 11 annotated regions. Hover or focus to inspect, select to magnify, and follow related papers.",
        "- **Figure viewer:** full-screen viewing, zoom, pan, download, and keyboard dismissal.",
        "- **Evidence lab:** scrub through the five cumulative MASS optimization stages, inspect exact mean scores, and compare with the original figure.",
        "- **Paper library:** search and filter the 256 cited works, including 29 representative methods with evidence details.",
        "", "The blue interface supports keyboard navigation and reduced-motion preferences. Figure sources and export bounds are documented in [the asset notes](docs/assets/figures/README.md).", ""
    ]
    (ROOT / "README.md").write_text("\n".join(lines), encoding="utf-8")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    collect(parser.parse_args().source.resolve())
