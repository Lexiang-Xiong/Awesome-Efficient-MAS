"""Export active LaTeX citations, section membership and the evidence table.

Uses only Python's standard library. Does not upload the manuscript.
Usage: python scripts/sync_survey.py --source /path/to/manuscript
"""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import html
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

VISUAL_TOUR = """## A visual tour of the survey

Three views of where efficiency interventions act: the collaboration structure, its execution, and the configurations learned for future tasks.

### 01 · Topology — Shape the team

Prune redundant agents and links, construct task-specific teams, or adapt the collaboration graph as execution unfolds.

[![Topology: pruning, construction, and adaptation of multi-agent collaboration graphs](docs/assets/figures/pruning_figure-2400.webp)](docs/assets/figures/pruning_figure.png)

### 02 · Runtime — Control each request

Compress communication, route computation, reuse memory and cache, and schedule work to reduce execution overhead.

[![Runtime: communication, routing, state reuse, and scheduling](docs/assets/figures/runtime_overview_figure-2400.webp)](docs/assets/figures/runtime_overview_figure.png)

### 03 · Optimization — Learn reusable improvements

Refine prompts, search workflows, learn decision policies, and accumulate reusable skills.

[![Optimization: prompt optimization, workflow search, policy learning, and continual learning](docs/assets/figures/optimization_figure-2400.webp)](docs/assets/figures/optimization_figure.png)

*Figures from the survey. Select an image for the full-resolution version, or [explore the figures and related papers on the project page](https://lexiang-xiong.github.io/Awesome-Efficient-MAS/#taxonomy).*"""


def write_readme(data):
    papers = data["papers"]
    lines = ["<div align=\"center\">", "", "# Efficiency in LLM Multi-Agent Systems", "", "### A Survey · More intelligence. Less overhead.", "",
        "**Qi Li*** · **Lexiang Xiong*** · **Haiquan Lu*** · Wenjie Qu · Xingyi Yang · Jiaheng Zhang · Xinchao Wang", "",
        "National University of Singapore · University of California, Berkeley · The Hong Kong Polytechnic University", "", "<sub>* Equal contribution</sub>", "",
        f"**{len(papers)} cited works** &nbsp; / &nbsp; **3 control points** &nbsp; / &nbsp; **11 method families**", "",
        "[🌐 Interactive page](https://lexiang-xiong.github.io/Awesome-Efficient-MAS/) · [📑 Paper](https://www.preprints.org/manuscript/202609.1639/v1) · [📄 Survey PDF](docs/assets/Efficiency_LLM_MAS_Survey.pdf) · [📚 Bibliography](docs/data/references.bib) · [📝 Citation](#citation)", "", "</div>", "",
        "> When does the benefit of collaboration justify its end-to-end resource cost?", "",
        "LLM multi-agent systems broaden search and combine evidence, but introduce repeated inference, growing message histories, and coordination overhead. This survey connects quality gains to their complete resource cost: first identifying the **collaboration boundary**, then organizing methods by **Topology**, **Runtime**, and **Optimization**.", "",
        "## At a glance", "", "| Control point | What changes | Method families |", "| --- | --- | --- |",
        "| **Topology** | Participating agents and communication structure | Pruning · Construction · Adaptation |",
        "| **Runtime** | Information, models, state, and work activated per request | Communication · Routing · State · Scheduling |",
        "| **Optimization** | Reusable configurations learned through search or training | Prompt optimization · Workflow search · Policy learning · Continual learning |", "",
        "![Survey structure: collaboration boundary, Topology, Runtime, and Optimization, followed by Evaluation, Synthesis and open problems.](docs/assets/figures/survey-overview.svg)", "",
        VISUAL_TOUR, "",
        "## Reading guide", "", "- [Visual tour](#a-visual-tour-of-the-survey)", "- [Representative methods](#representative-methods)", "- [Paper collection](#paper-collection)", "- [Evaluation perspective](#evaluation-perspective)", "- [Open problems](#open-problems)", "- [Citation](#citation)", "",
        "## Representative methods", "", f"The survey compares **{data['stats']['evidenceMethods']} methods** across the three control points. The table summarizes their reported effects and the conditions that matter when interpreting those results.", "", "| Family | Method | Reported effect | Main boundary |", "| --- | --- | --- | --- |"]
    for p in sorted((p for p in papers if p["evidence"]), key=lambda p:(['Topology','Runtime','Optimization'].index(p['evidence']['family']),p['evidence']['subfamily'],p['method'])):
        e=p['evidence']; method=f"[{md(p['method'])}]({p['url']})" if p['url'] else md(p['method'])
        lines.append(f"| {e['family']} / {e['subfamily']} | {method} | {md(e['effect'])} | {md(e['boundary'])} |")
    lines.extend(["", "## Paper collection", "", "Explore the works discussed in the survey, grouped by section. A paper may appear in multiple sections when it addresses several aspects of efficiency.", ""])
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
        "## Citation", "", "If you find this survey useful, please cite our work. Version 1 was posted on [Preprints.org](https://www.preprints.org/manuscript/202609.1639/v1) on 20 September 2026.", ""])
    # Keep the reader-facing citation aligned with the copyable website entry.
    page = (ROOT / "docs/index.html").read_text(encoding="utf-8")
    citation = re.search(r'<code id="citation-code">(.*?)</code>', page, re.S)
    if not citation:
        raise ValueError("Survey citation is missing from the homepage")
    lines.extend(["```bibtex", html.unescape(citation.group(1)).strip(), "```", ""])
    (ROOT / "README.md").write_text("\n".join(lines), encoding="utf-8")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    collect(parser.parse_args().source.resolve())
