import path from 'node:path';
import { Marked } from 'marked';
import { inlineImages } from './assets.js';
import { escapeHtml, getHtmlTemplate, type Theme } from './theme/template.js';

export interface RenderOptions {
  title?: string;
  theme?: Theme;
  compactLevel?: number;
  /** Directory of the source file; enables local image inlining. */
  baseDir?: string;
  assetRoots?: string[];
  /** Drop <a> wrappers around images (default true). */
  unwrapImageLinks?: boolean;
  /** Include the print/copy buttons and the CDN Mermaid loader. */
  interactive?: boolean;
}

export interface RenderResult {
  html: string;
  warnings: string[];
}

const marked = new Marked({ gfm: true, breaks: false });

// ```mermaid fences become <pre class="mermaid">, which Mermaid renders in place.
marked.use({
  renderer: {
    code({ text, lang }) {
      if (lang?.trim() === 'mermaid') {
        return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
      }
      return false;
    },
  },
});

/** "my-doc_name.md" -> "My Doc Name" */
export function titleFromPath(file: string): string {
  return path
    .basename(file, path.extname(file))
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Convert Markdown to a complete HTML document. */
export function markdownToHtml(
  markdown: string,
  options: RenderOptions = {},
): RenderResult {
  const {
    title = 'Document',
    theme = 'default',
    compactLevel = 0,
    baseDir,
    assetRoots,
    unwrapImageLinks = true,
    interactive = true,
  } = options;
  const warnings: string[] = [];

  let body = marked.parse(markdown, { async: false });
  if (baseDir) {
    body = inlineImages(body, {
      baseDir,
      assetRoots,
      unwrapLinks: unwrapImageLinks,
      warnings,
    });
  }

  const html = getHtmlTemplate(body, {
    title,
    theme,
    compactLevel,
    includePrintButton: interactive,
    mermaidFromCdn: interactive,
  });
  return { html, warnings };
}
