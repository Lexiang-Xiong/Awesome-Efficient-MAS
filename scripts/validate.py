"""Check the publishable site and data integrity without third-party packages."""
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs = [], []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ("src", "href"):
            if attrs.get(key):
                self.refs.append(attrs[key])

def validate():
    data = json.loads((DOCS / "data/papers.json").read_text(encoding="utf-8"))
    script = (DOCS / "data/papers.js").read_text(encoding="utf-8")
    assert json.loads(script.removeprefix("window.SURVEY_DATA = ").rstrip().removesuffix(";")) == data, "JSON and browser dataset diverged"
    papers = data["papers"]
    assert data["stats"]["cited"] == len(papers)
    assert len({p["key"] for p in papers}) == len(papers), "Duplicate paper keys"
    assert sum(bool(p["evidence"]) for p in papers) == data["stats"]["evidenceMethods"]
    bib = (DOCS / "data/references.bib").read_text(encoding="utf-8")
    assert len(re.findall(r"@\w+\s*\{", bib)) == len(papers)
    allowed = {"Topology", "Runtime", "Optimization", "Collaboration Boundary", "Background", "Foundations", "Evaluation", "Synthesis", "Open Problems", "Introduction", "Conclusion"}
    for paper in papers:
        assert paper["title"] and paper["authors"], f"Missing metadata: {paper['key']}"
        assert set(paper["categories"]) <= allowed, f"Unknown section: {paper['categories']}"
        if paper["url"]:
            assert urlparse(paper["url"]).scheme in ("https", "http"), paper["key"]
        if paper["evidence"]:
            assert paper["evidence"]["family"] in paper["categories"]
            assert "\\" not in paper["evidence"]["boundary"]
    html = (DOCS / "index.html").read_text(encoding="utf-8")
    doc = Document()
    doc.feed(html)
    assert len(doc.ids) == len(set(doc.ids)), "Duplicate HTML IDs"
    for ref in doc.refs:
        parsed = urlparse(ref)
        if parsed.scheme or ref.startswith("//"):
            continue
        if parsed.path:
            assert not parsed.path.startswith("/"), "Use project-subpath-safe relative assets"
            target = (DOCS / unquote(parsed.path)).resolve()
            assert target.is_relative_to(DOCS.resolve()) and target.is_file(), f"Missing local asset: {ref}"
        elif parsed.fragment:
            assert parsed.fragment in doc.ids, f"Broken anchor: {ref}"
    for file in ["app.js", "interactions.js", "library-model.js", "research-map-model.js", "research-explorer.js", "focus-literature.js", "data/site.js", "data/papers.js"]:
        subprocess.run(["node", "--check", str(DOCS / file)], check=True)
    subprocess.run(["node", str(ROOT / "scripts/test_library.cjs")], check=True)
    subprocess.run(["node", str(ROOT / "scripts/test_research_map.cjs")], check=True)
    interaction_source = (DOCS / "interactions.js").read_text(encoding="utf-8")
    for name in ["pruning_figure", "runtime_overview_figure", "optimization_figure", "optimization_results_b"]:
        assert (DOCS / "assets/figures" / (name + ".png")).is_file(), f"Missing figure: {name}"
        if name != "optimization_results_b":
            assert (DOCS / "assets/figures" / (name + ".webp")).is_file(), f"Missing lossless web figure: {name}"
    for value in ["63.54", "67.44", "74.56", "77.55", "78.40"]:
        assert value in interaction_source, f"Missing MASS stage: {value}"
    assert "BadWAM" not in html and "BadWAM" not in (DOCS / "data/site.js").read_text(encoding="utf-8")
    assert not any(p.suffix in {".tex", ".zip", ".env", ".ttf"} for p in DOCS.rglob("*")), "Unexpected manuscript or font assets in publication directory"
    print(f"PASS: {len(papers)} unique papers, {data['stats']['evidenceMethods']} evidence methods, matching JSON/JS/BibTeX, local assets, anchors, safe subpaths, and JavaScript syntax.")
    print("External paper URLs and publication metadata are copied from the manuscript; network reachability is not asserted.")

if __name__ == "__main__":
    validate()
