const { getHtmlTemplate, getStyles } = require('../lib/template');

describe('template', () => {
  describe('getHtmlTemplate', () => {
    it('should generate valid HTML document structure', () => {
      const html = getHtmlTemplate('<p>Content</p>');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
      expect(html).toContain('</html>');
    });

    it('should include meta charset and viewport', () => {
      const html = getHtmlTemplate('<p>Content</p>');

      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('viewport');
    });

    it('should use provided title', () => {
      const html = getHtmlTemplate('<p>Content</p>', { title: 'My Title' });

      expect(html).toContain('<title>My Title</title>');
    });

    it('should use default title when not provided', () => {
      const html = getHtmlTemplate('<p>Content</p>');

      expect(html).toContain('<title>Document</title>');
    });

    it('should escape HTML entities in title', () => {
      const html = getHtmlTemplate('<p>Content</p>', { title: 'A & B <test>' });

      expect(html).toContain('A &amp; B &lt;test&gt;');
    });

    it('should include Mermaid.js CDN script', () => {
      const html = getHtmlTemplate('<p>Content</p>');

      expect(html).toContain('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js');
    });

    it('should initialize Mermaid with correct configuration', () => {
      const html = getHtmlTemplate('<p>Content</p>');

      expect(html).toContain('mermaid.initialize');
      expect(html).toContain('startOnLoad: true');
      expect(html).toContain("securityLevel: 'loose'");
      expect(html).toContain('useMaxWidth: true');
    });

    it('should use default mermaid theme for default theme', () => {
      const html = getHtmlTemplate('<p>Content</p>', { theme: 'default' });

      expect(html).toContain("theme: 'default'");
    });

    it('should use dark mermaid theme for dark theme', () => {
      const html = getHtmlTemplate('<p>Content</p>', { theme: 'dark' });

      expect(html).toContain("theme: 'dark'");
    });

    it('should wrap content in article element', () => {
      const html = getHtmlTemplate('<p>Test content</p>');

      expect(html).toContain('<article>');
      expect(html).toContain('<p>Test content</p>');
      expect(html).toContain('</article>');
    });

    it('should include print button by default', () => {
      const html = getHtmlTemplate('<p>Content</p>');

      expect(html).toContain('class="print-button"');
      expect(html).toContain("onclick=\"window.print()\"");
      expect(html).toContain('Print / Save as PDF');
    });

    it('should exclude print button when includePrintButton is false', () => {
      const html = getHtmlTemplate('<p>Content</p>', { includePrintButton: false });

      expect(html).not.toContain('print-button');
    });

    it('should include styles by default', () => {
      const html = getHtmlTemplate('<p>Content</p>');

      expect(html).toContain('<style>');
    });

    it('should exclude styles when includeStyles is false', () => {
      const html = getHtmlTemplate('<p>Content</p>', { includeStyles: false });

      expect(html).not.toContain('<style>');
    });

    it('should include smooth scrolling script for anchor links', () => {
      const html = getHtmlTemplate('<p>Content</p>');

      expect(html).toContain("querySelectorAll('a[href^=\"#\"]')");
      expect(html).toContain('scrollIntoView');
      expect(html).toContain("behavior: 'smooth'");
    });

    it('should include copy button script for code blocks', () => {
      const html = getHtmlTemplate('<p>Content</p>');

      expect(html).toContain("querySelectorAll('pre code')");
      expect(html).toContain('copy-button');
      expect(html).toContain('navigator.clipboard.writeText');
    });
  });

  describe('getStyles', () => {
    describe('theme styles', () => {
      it('should generate light theme colors by default', () => {
        const styles = getStyles();

        expect(styles).toContain('--color-bg: #ffffff');
        expect(styles).toContain('--color-text: #1e293b');
      });

      it('should generate light theme colors for default theme', () => {
        const styles = getStyles('default');

        expect(styles).toContain('--color-bg: #ffffff');
        expect(styles).toContain('--color-primary: #2563eb');
      });

      it('should generate dark theme colors for dark theme', () => {
        const styles = getStyles('dark');

        expect(styles).toContain('--color-bg: #0f172a');
        expect(styles).toContain('--color-text: #f1f5f9');
        expect(styles).toContain('--color-primary: #60a5fa');
      });
    });

    describe('compactness styles', () => {
      it('should apply compact spacing (0.5x multiplier)', () => {
        const styles = getStyles('default', 'compact');

        expect(styles).toContain('line-height: 1.3');
        expect(styles).toContain('font-size: 10pt'); // print font size
        expect(styles).toContain('margin: 1.5cm'); // page margin
      });

      it('should apply normal spacing (1x multiplier)', () => {
        const styles = getStyles('default', 'normal');

        expect(styles).toContain('line-height: 1.6');
        expect(styles).toContain('font-size: 11pt');
        expect(styles).toContain('margin: 2cm');
      });

      it('should apply spacious spacing (1.5x multiplier)', () => {
        const styles = getStyles('default', 'spacious');

        expect(styles).toContain('line-height: 1.9');
        expect(styles).toContain('font-size: 12pt');
        expect(styles).toContain('margin: 2.5cm');
      });

      it('should default to normal compactness for invalid values', () => {
        const styles = getStyles('default', 'invalid');

        expect(styles).toContain('line-height: 1.6');
      });
    });

    describe('print styles', () => {
      it('should include @media print rules', () => {
        const styles = getStyles();

        expect(styles).toContain('@media print');
      });

      it('should hide print and copy buttons in print', () => {
        const styles = getStyles();

        expect(styles).toContain('.print-button, .copy-button');
        expect(styles).toContain('display: none');
      });

      it('should set page size to A4', () => {
        const styles = getStyles();

        expect(styles).toContain('size: A4');
      });

      it('should include page-break rules', () => {
        const styles = getStyles();

        expect(styles).toContain('page-break-before: always');
        expect(styles).toContain('page-break-after: avoid');
        expect(styles).toContain('page-break-inside: avoid');
      });
    });

    describe('element styles', () => {
      it('should include heading styles', () => {
        const styles = getStyles();

        expect(styles).toContain('h1, h2, h3, h4, h5, h6');
        expect(styles).toContain('font-weight: 700');
      });

      it('should include code block styles', () => {
        const styles = getStyles();

        expect(styles).toContain('pre {');
        expect(styles).toContain('overflow-x: auto');
        expect(styles).toContain('font-family:');
      });

      it('should include table styles', () => {
        const styles = getStyles();

        expect(styles).toContain('table {');
        expect(styles).toContain('border-collapse: collapse');
        expect(styles).toContain('th, td {');
      });

      it('should include mermaid container styles', () => {
        const styles = getStyles();

        expect(styles).toContain('.mermaid {');
        expect(styles).toContain('justify-content: center');
      });

      it('should include blockquote styles', () => {
        const styles = getStyles();

        expect(styles).toContain('blockquote {');
        expect(styles).toContain('border-left:');
        expect(styles).toContain('font-style: italic');
      });

      it('should include link styles', () => {
        const styles = getStyles();

        expect(styles).toContain('a {');
        expect(styles).toContain('text-decoration: none');
        expect(styles).toContain('a:hover {');
      });

      it('should include list styles', () => {
        const styles = getStyles();

        expect(styles).toContain('ul, ol {');
        expect(styles).toContain('li {');
      });
    });

    describe('interactive element styles', () => {
      it('should include print button styles', () => {
        const styles = getStyles();

        expect(styles).toContain('.print-button {');
        expect(styles).toContain('position: fixed');
        expect(styles).toContain('z-index: 1000');
      });

      it('should include copy button styles', () => {
        const styles = getStyles();

        expect(styles).toContain('.copy-button {');
        expect(styles).toContain('position: absolute');
        expect(styles).toContain('opacity: 0');
      });

      it('should show copy button on pre hover', () => {
        const styles = getStyles();

        expect(styles).toContain('pre:hover .copy-button');
        expect(styles).toContain('opacity: 1');
      });
    });

    describe('CSS variables', () => {
      it('should define CSS custom properties in :root', () => {
        const styles = getStyles();

        expect(styles).toContain(':root {');
        expect(styles).toContain('--color-primary:');
        expect(styles).toContain('--color-secondary:');
        expect(styles).toContain('--color-success:');
        expect(styles).toContain('--color-warning:');
        expect(styles).toContain('--color-danger:');
        expect(styles).toContain('--color-bg:');
        expect(styles).toContain('--color-bg-alt:');
        expect(styles).toContain('--color-border:');
        expect(styles).toContain('--color-text:');
        expect(styles).toContain('--color-text-muted:');
      });
    });
  });
});
