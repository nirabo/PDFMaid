const { getPaperStyles, wrapFrontmatter } = require('../lib/paper-theme');
const {
  getHtmlTemplate,
  getStyles,
  mermaidThemeFor,
} = require('../lib/template');
const { markdownToHtml } = require('../lib/converter');

describe('paper theme', () => {
  describe('getPaperStyles', () => {
    it('uses a serif body, page numbers and booktabs rules', () => {
      const css = getPaperStyles();
      expect(css).toContain("'Latin Modern Roman'");
      expect(css).toContain('counter(page)');
      expect(css).toContain('border-top: 1pt solid');
      expect(css).toContain('counter-increment: section');
    });

    it('wraps code blocks instead of clipping them', () => {
      expect(getPaperStyles()).toContain('white-space: pre-wrap');
    });

    it('scales with the compact level and clamps it', () => {
      expect(getPaperStyles(-5)).toContain('html { font-size: 9.5pt; }');
      expect(getPaperStyles(5)).toContain('html { font-size: 11.5pt; }');
      expect(getPaperStyles(99)).toBe(getPaperStyles(5));
      expect(getPaperStyles(-99)).toBe(getPaperStyles(-5));
    });

    it('is selected by getStyles for the paper theme', () => {
      expect(getStyles('paper')).toBe(getPaperStyles(0));
    });
  });

  describe('wrapFrontmatter', () => {
    it('wraps the title and its metadata up to the first h2', () => {
      const html = '<h1>T</h1>\n<p>Intro</p>\n<h2>One</h2><p>x</p>';
      const out = wrapFrontmatter(html);
      expect(out).toBe(
        '<header class="frontmatter"><h1>T</h1>\n<p>Intro</p>\n</header><h2>One</h2><p>x</p>',
      );
    });

    it('turns "**Label:** value" lines into a definition list', () => {
      const html =
        '<h1>T</h1><p><strong>Date:</strong> 2026-10-05\n<strong>Status:</strong> Active</p><h2>A</h2>';
      const out = wrapFrontmatter(html);
      expect(out).toContain(
        '<dl class="meta"><dt>Date</dt><dd>2026-10-05</dd><dt>Status</dt><dd>Active</dd></dl>',
      );
    });

    it('keeps a paragraph that is not a label list unchanged', () => {
      const html =
        '<h1>T</h1><p><strong>Bold</strong> lead, then text</p><h2>A</h2>';
      expect(wrapFrontmatter(html)).toContain(
        '<p><strong>Bold</strong> lead, then text</p>',
      );
    });

    it('wraps to the end when there is no h2', () => {
      expect(wrapFrontmatter('<h1>T</h1><p>x</p>')).toBe(
        '<header class="frontmatter"><h1>T</h1><p>x</p></header>',
      );
    });

    it('leaves a document without an h1 unchanged', () => {
      expect(wrapFrontmatter('<p>x</p>')).toBe('<p>x</p>');
    });
  });

  describe('template integration', () => {
    it('uses the neutral Mermaid theme', () => {
      expect(mermaidThemeFor('paper')).toBe('neutral');
      expect(mermaidThemeFor('dark')).toBe('dark');
      expect(mermaidThemeFor('default')).toBe('default');
      expect(getHtmlTemplate('<p>x</p>', { theme: 'paper' })).toContain(
        "theme: 'neutral'",
      );
    });

    it('wraps the front matter only for the paper theme', () => {
      const md = '# Title\n\n**Date:** today\n\n## Section\n\nText';
      expect(markdownToHtml(md, { theme: 'paper' })).toContain(
        '<header class="frontmatter">',
      );
      expect(markdownToHtml(md, { theme: 'default' })).not.toContain(
        'class="frontmatter"',
      );
    });
  });
});
