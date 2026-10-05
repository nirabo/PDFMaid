/**
 * The "paper" theme: a compact, LaTeX-like look for technical and scientific
 * documents. Serif body, numbered sections, a small title block, booktabs-style
 * tables, monochrome code and page numbers.
 */

const SERIF =
  "'Latin Modern Roman', 'LM Roman 10', 'CMU Serif', 'Computer Modern Serif', 'TeX Gyre Pagella', 'STIX Two Text', 'Charter', 'Bitstream Charter', Georgia, serif";

// Box-drawing and arrow glyphs must come from one monospace font, or ASCII
// diagrams lose their alignment. DejaVu Sans Mono covers them; Latin Modern
// Mono does not, so it is used for inline code only.
const MONO_BLOCK =
  "'DejaVu Sans Mono', 'Menlo', 'Consolas', 'Liberation Mono', monospace";
const MONO_INLINE = `'Latin Modern Mono', 'LM Mono 10', 'CMU Typewriter Text', ${MONO_BLOCK}`;

const INK = '#111111';
const MUTED = '#555555';
const RULE = '#222222';
const LINK = '#1f3a68';

/**
 * Turn a paragraph of "**Label:** value" lines into a definition list, one
 * label per row. Returns null when the paragraph is not of that shape.
 * @param {string} inner - Paragraph HTML (without the <p> tags)
 * @returns {string|null} A <dl class="meta"> element, or null
 */
function metaList(inner) {
  const parts = inner.split(/\n(?=<strong>)/);
  const matches = parts.map((part) =>
    part.match(/^<strong>([^<]+?)(?::<\/strong>|<\/strong>:)\s*([\s\S]*)$/),
  );
  if (matches.some((match) => !match)) {
    return null;
  }
  const rows = matches.map(
    (match) => `<dt>${match[1].trim()}</dt><dd>${match[2].trim()}</dd>`,
  );
  return rows.length ? `<dl class="meta">${rows.join('')}</dl>` : null;
}

/**
 * Wrap everything from the first <h1> up to the first <h2> in a title block.
 * Inside it, a paragraph made of "**Label:** value" lines becomes a
 * definition list with one label per row.
 * @param {string} html - Rendered document body
 * @returns {string} Body with a <header class="frontmatter"> block
 */
function wrapFrontmatter(html) {
  const h1 = html.indexOf('<h1');
  if (h1 === -1) {
    return html;
  }
  const h2 = html.indexOf('<h2', h1);
  const end = h2 === -1 ? html.length : h2;
  const front = html
    .slice(h1, end)
    .replace(
      /<p>(<strong>[\s\S]*?)<\/p>/g,
      (match, inner) => metaList(inner) || match,
    );
  return `${html.slice(0, h1)}<header class="frontmatter">${front}</header>${html.slice(end)}`;
}

/**
 * Styles for the paper theme.
 * @param {number} compactLevel - -5 (most compact) to 5 (most spacious)
 * @returns {string} A <style> element
 */
function getPaperStyles(compactLevel = 0) {
  const level = Math.max(-5, Math.min(5, compactLevel));
  const fontSize = 10.5 + level * 0.2; // pt: 9.5 .. 11.5
  const lineHeight = 1.32 + level * 0.03;
  const gap = 0.55 + level * 0.08; // em, vertical rhythm
  const marginV = 2.0 + level * 0.15; // cm
  const marginH = 2.1 + level * 0.15; // cm

  return `<style>
    @page {
      size: A4;
      margin: ${marginV}cm ${marginH}cm;
      @bottom-center {
        content: counter(page);
        font-family: ${SERIF};
        font-size: 9pt;
        color: ${MUTED};
      }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html { font-size: ${fontSize}pt; }

    body {
      font-family: ${SERIF};
      font-size: 1rem;
      line-height: ${lineHeight};
      color: ${INK};
      background: #ffffff;
      max-width: 46rem;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      counter-reset: section;
      font-kerning: normal;
      font-variant-ligatures: common-ligatures;
      text-rendering: optimizeLegibility;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @media print {
      body { max-width: none; padding: 0; }
      .print-button, .copy-button { display: none !important; }
    }

    /* ---- Title block ---------------------------------------------------- */
    header.frontmatter {
      text-align: center;
      margin-bottom: ${gap * 2}em;
      padding-bottom: ${gap}em;
      border-bottom: 0.6pt solid ${RULE};
    }

    header.frontmatter h1 {
      font-size: 1.55rem;
      font-weight: 700;
      line-height: 1.2;
      margin: 0 0 ${gap}em;
      letter-spacing: -0.005em;
    }

    header.frontmatter p {
      font-size: 0.86rem;
      line-height: 1.3;
      color: ${MUTED};
      text-align: center;
      hyphens: manual;
      margin: 0 auto ${gap * 0.6}em;
      max-width: 40rem;
    }

    dl.meta {
      display: grid;
      grid-template-columns: max-content 1fr;
      column-gap: 0.9em;
      row-gap: 0.15em;
      max-width: 40rem;
      margin: ${gap}em auto 0;
      font-size: 0.84rem;
      line-height: 1.3;
      text-align: left;
    }

    dl.meta dt {
      font-variant: small-caps;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-align: right;
      color: ${INK};
    }

    dl.meta dd {
      color: ${MUTED};
      text-align: left;
      hyphens: auto;
    }

    header.frontmatter p strong {
      font-variant: small-caps;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: ${INK};
    }

    header.frontmatter code { font-size: 0.92em; }

    /* ---- Headings ------------------------------------------------------- */
    h1, h2, h3, h4, h5, h6 {
      color: ${INK};
      font-weight: 700;
      line-height: 1.25;
      break-after: avoid;
      page-break-after: avoid;
    }

    article > h1 {
      font-size: 1.45rem;
      text-align: center;
      margin: 0 0 ${gap * 2}em;
    }

    h2 {
      font-size: 1.2rem;
      margin: ${gap * 2.2}em 0 ${gap}em;
      counter-increment: section;
      counter-reset: subsection;
    }

    h3 {
      font-size: 1.05rem;
      margin: ${gap * 1.8}em 0 ${gap * 0.8}em;
      counter-increment: subsection;
      counter-reset: subsubsection;
    }

    h4 {
      font-size: 1rem;
      font-style: italic;
      margin: ${gap * 1.4}em 0 ${gap * 0.6}em;
      counter-increment: subsubsection;
    }

    h5, h6 {
      font-size: 1rem;
      font-weight: 600;
      margin: ${gap * 1.2}em 0 ${gap * 0.5}em;
    }

    article > h2::before { content: counter(section) "\\2003"; }
    article > h3::before { content: counter(section) "." counter(subsection) "\\2003"; }
    article > h4::before {
      content: counter(section) "." counter(subsection) "." counter(subsubsection) "\\2003";
      font-style: normal;
    }

    /* ---- Body text ------------------------------------------------------ */
    p {
      margin: 0 0 ${gap}em;
      text-align: justify;
      hyphens: auto;
      orphans: 2;
      widows: 2;
    }

    strong { font-weight: 700; color: inherit; }
    em { font-style: italic; }

    a { color: ${LINK}; text-decoration: none; }

    ul, ol {
      margin: 0 0 ${gap}em;
      padding-left: 1.6em;
    }

    li { margin: 0 0 ${gap * 0.35}em; text-align: justify; hyphens: auto; }
    li > ul, li > ol { margin-top: ${gap * 0.35}em; margin-bottom: 0; }
    li > p { margin-bottom: ${gap * 0.35}em; }

    blockquote {
      margin: ${gap}em 2em;
      font-style: italic;
      color: ${INK};
    }
    blockquote p { text-align: justify; }

    hr {
      border: none;
      border-top: 0.5pt solid ${RULE};
      margin: ${gap * 2}em 25%;
    }

    /* ---- Code ----------------------------------------------------------- */
    code {
      font-family: ${MONO_INLINE};
      font-size: 0.93em;
      color: inherit;
      background: none;
      padding: 0;
      border-radius: 0;
      hyphens: none;
    }

    pre {
      font-family: ${MONO_BLOCK};
      font-size: 0.72rem;
      line-height: 1.32;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      overflow: visible;
      margin: ${gap}em 0 ${gap * 1.2}em;
      padding: ${gap * 0.8}em 0 ${gap * 0.8}em 0.9em;
      border: none;
      border-left: 0.6pt solid ${MUTED};
      background: #f7f7f5;
      border-radius: 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    pre code {
      font-family: inherit;
      font-size: 1em;
      color: ${INK};
      background: none;
      padding: 0;
    }

    .hljs-keyword, .hljs-function { font-weight: 700; color: ${INK}; }
    .hljs-string { color: #333333; }
    .hljs-comment { color: ${MUTED}; font-style: italic; }
    .hljs-number { color: ${INK}; }

    /* ---- Tables (booktabs) ---------------------------------------------- */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: ${gap}em 0 ${gap * 1.4}em;
      font-size: 0.88rem;
      line-height: 1.28;
      border-top: 1pt solid ${RULE};
      border-bottom: 1pt solid ${RULE};
      break-inside: auto;
    }

    thead th {
      border-bottom: 0.6pt solid ${RULE};
      font-weight: 700;
      text-align: left;
      background: none;
    }

    th, td {
      border: none;
      padding: 0.28em 0.55em;
      vertical-align: top;
      text-align: left;
      hyphens: auto;
    }

    th:first-child, td:first-child { padding-left: 0.2em; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    tr:nth-child(even) { background: none; }

    /* ---- Figures (Mermaid) ---------------------------------------------- */
    .mermaid, .mermaid-container {
      background: none;
      border: none;
      border-radius: 0;
      padding: ${gap}em 0;
      margin: ${gap}em 0;
      display: flex;
      justify-content: center;
      overflow: visible;
      break-inside: avoid;
    }

    .mermaid-container svg.mermaid-prerendered { max-width: 100%; height: auto; }

    img { max-width: 100%; }

    /* ---- Screen-only controls ------------------------------------------- */
    .print-button {
      position: fixed;
      top: 16px;
      right: 16px;
      background: ${INK};
      color: #ffffff;
      border: none;
      padding: 0.5rem 1rem;
      font-family: ${SERIF};
      cursor: pointer;
      z-index: 1000;
    }

    .copy-button {
      position: absolute;
      top: 4px;
      right: 4px;
      padding: 2px 8px;
      font-size: 11px;
      cursor: pointer;
      background: #ffffff;
      color: ${INK};
      border: 0.6pt solid ${MUTED};
      opacity: 0;
    }

    pre:hover .copy-button { opacity: 1; }
  </style>`;
}

module.exports = {
  getPaperStyles,
  wrapFrontmatter,
};
