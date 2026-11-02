# PDFMaid

Markdown to PDF/HTML with Mermaid diagrams. Output is self-contained: images are
embedded, Mermaid ships with the package, and nothing is fetched at render time.

## Install

Requires Node.js 20+ and a Chrome or Chromium installation.

```bash
npm install -g pdfmaid
```

PDFMaid finds Chrome automatically. Otherwise pass `--chrome <path>` or set
`CHROME_PATH`.

## Usage

```bash
pdfmaid report.md                          # -> report.pdf next to the input
pdfmaid docs/*.md --out-dir pdf --theme paper
pdfmaid page.md -o page.html               # format follows the extension
pdfmaid page.md --asset-root site/static --strict
pdfmaid slides.md -f md                    # Mermaid -> inline SVG, still Markdown
```

Run `pdfmaid --help` for every option. Exit codes: `0` success, `1` a
conversion failed (or `--strict` found a problem), `2` usage error.

### Images

Local images are embedded as data URIs, so the result does not depend on where it
is written. Relative paths resolve against the Markdown file. Root-absolute paths
such as `/img/a.png` (Docusaurus, Vite, Hugo style) resolve against `static/`,
`public/` or `assets/` in any ancestor directory of the input, plus any
`--asset-root`. Links that wrap an image are removed for print
(`--keep-image-links` to keep them). A missing image is a warning; with
`--strict` it fails the run.

### Themes

| Theme     | Notes                                                                |
| --------- | -------------------------------------------------------------------- |
| `default` | Light, screen-oriented                                               |
| `dark`    | Dark                                                                 |
| `paper`   | Compact, LaTeX-like: serif, numbered sections, booktabs-style tables |

`--compact -5..5` tightens or loosens spacing.

## API

```ts
import { convertFile, createBrowserProvider } from 'pdfmaid';

const browsers = createBrowserProvider();
try {
  const { output, warnings } = await convertFile(
    'report.md',
    { format: 'pdf', theme: 'paper' },
    browsers,
  );
} finally {
  await browsers.close();
}
```

`markdownToHtml`, `renderPdf`, `inlineImages` and `prerenderMermaidDiagrams` are
exported too. The package is ESM-only with bundled types.

## Development

```bash
npm ci
npm run check    # lint, typecheck, tests with coverage, build
```

## License

MIT
