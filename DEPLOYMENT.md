# GitHub repository and Pages

Suggested repository name: **Awesome-Efficient-MAS**. The local folder name does not determine the remote name. The GitHub owner and final publication metadata remain to be confirmed.

## Publish the prepared repository

Create an empty repository on the intended GitHub account or organization. Upload the contents of this project folder, including `.github`, with the branch named `main`. Do not upload the parent folder or the manuscript archive.

If using GitHub CLI after installing and signing in:

```bash
git init -b main
git add .
git commit -m "Add MAS efficiency survey website and paper collection"
gh repo create OWNER/Awesome-Efficient-MAS --public --source=. --remote=origin --push
```

Replace `OWNER` with the confirmed GitHub owner. The command above creates a public repository. Select private instead if the authors require a private review stage; Pages availability for private repositories depends on the account plan.

## Enable GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Set **Build and deployment → Source → GitHub Actions**.
3. Run **Actions → Deploy survey to GitHub Pages → Run workflow**, or push a change under `docs/`.
4. Wait for both jobs to succeed. GitHub displays the final Pages URL in the deployment environment, usually `https://OWNER.github.io/Awesome-Efficient-MAS/`.
5. Add that confirmed URL to the repository's **About → Website** field.

The workflow validates and uploads `docs/` only. No build service, database, token secret, or third-party hosting account is needed. Repository permissions for the deployment job are limited to Pages and OIDC publishing; other jobs have read-only content access.

Alternatively, deploy from branch `main`, folder `/docs`, and remove the Actions deployment workflow before committing to avoid two publication paths.

## Confirm public metadata

Edit `docs/data/site.js` to set `repositoryUrl` and `paperUrl`. Empty entries hide the corresponding button. The homepage displays a copyable preprint citation template in `docs/index.html` (`citation-code`), using the supplied title and author list, `archivePrefix = {arXiv}`, and empty `journal` and `eprint` fields. The authors confirmed that an arXiv identifier is not yet assigned. When publication details are available, replace this entry with the official BibTeX, update its status note, and add the published citation to the README generation template in `scripts/sync_survey.py`.

Before publication, the authors should select the repository's intended license. A code license does not grant reuse rights to third-party papers or figures.

## Local preview

```bash
python -m http.server 4173 --directory docs
```

The server is for preview only. Open `http://localhost:4173`. The website also works by opening `docs/index.html` directly. Optional Google Fonts fall back to system fonts if unavailable.

## Update the collection

```bash
python scripts/sync_survey.py --source "/path/to/manuscript"
python scripts/validate.py
```

Review the generated changes, commit, and push. The source manuscript stays outside this repository. Generated data records source-relative filenames and a source hash, with no machine-specific paths.


Official documentation: [Publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
