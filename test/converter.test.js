const fs = require('fs');
const path = require('path');
const os = require('os');
const { markdownToHtml, convertMarkdownFile } = require('../lib/converter');

describe('converter', () => {
  describe('markdownToHtml', () => {
    it('should convert basic markdown to HTML', () => {
      const markdown = '# Hello World\n\nThis is a paragraph.';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<h1');
      expect(html).toContain('Hello World');
      expect(html).toContain('<p>This is a paragraph.</p>');
    });

    it('should use provided title', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown, { title: 'Custom Title' });

      expect(html).toContain('<title>Custom Title</title>');
    });

    it('should use default title when not provided', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<title>Document</title>');
    });

    it('should convert mermaid code blocks to mermaid divs', () => {
      const markdown = '```mermaid\ngraph TD\n    A --> B\n```';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<div class="mermaid">');
      expect(html).toContain('graph TD');
      expect(html).not.toContain('language-mermaid');
    });

    it('should preserve non-mermaid code blocks', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<code');
      expect(html).toContain('const x = 1;');
    });

    it('should apply dark theme', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown, { theme: 'dark' });

      expect(html).toContain("theme: 'dark'");
      expect(html).toContain('#0f172a'); // dark background color
    });

    it('should apply default (light) theme', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown, { theme: 'default' });

      expect(html).toContain("theme: 'default'");
      expect(html).toContain('#ffffff'); // light background color
    });

    it('should include styles by default', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<style>');
    });

    it('should exclude styles when includeStyles is false', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown, { includeStyles: false });

      expect(html).not.toContain('<style>');
    });

    it('should include print button by default', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown);

      expect(html).toContain('class="print-button"');
      expect(html).toContain('Print / Save as PDF');
    });

    it('should exclude print button when includePrintButton is false', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown, { includePrintButton: false });

      expect(html).not.toContain('class="print-button"');
    });

    it('should support negative compactLevel for more compact layouts', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown, { compactLevel: -5 });

      expect(html).toContain('line-height: 1.3');
    });

    it('should support default compactLevel (0) for normal layout', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown, { compactLevel: 0 });

      expect(html).toContain('line-height: 1.6');
    });

    it('should support positive compactLevel for more spacious layouts', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown, { compactLevel: 5 });

      expect(html).toContain('line-height: 1.9');
    });

    it('should convert GFM tables', () => {
      const markdown = '| A | B |\n|---|---|\n| 1 | 2 |';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<table>');
      expect(html).toContain('<th>A</th>');
      expect(html).toContain('<td>1</td>');
    });

    it('should convert lists', () => {
      const markdown = '- Item 1\n- Item 2\n\n1. First\n2. Second';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<ol>');
      expect(html).toContain('<li>First</li>');
    });

    it('should convert blockquotes', () => {
      const markdown = '> This is a quote';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<blockquote>');
      expect(html).toContain('This is a quote');
    });

    it('should convert links', () => {
      const markdown = '[Link](https://example.com)';
      const html = markdownToHtml(markdown);

      expect(html).toContain('<a href="https://example.com">Link</a>');
    });

    it('should include Mermaid.js script', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown);

      expect(html).toContain('mermaid@10');
      expect(html).toContain('mermaid.initialize');
    });

    it('should escape HTML in title', () => {
      const markdown = '# Test';
      const html = markdownToHtml(markdown, {
        title: '<script>alert("xss")</script>',
      });

      expect(html).not.toContain('<script>alert');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('convertMarkdownFile', () => {
    let tempDir;
    let inputFile;
    let outputFile;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfmaid-test-'));
      inputFile = path.join(tempDir, 'test.md');
      outputFile = path.join(tempDir, 'test.html');
    });

    afterEach(() => {
      // Clean up temp files
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    });

    it('should convert markdown file to HTML file', () => {
      fs.writeFileSync(inputFile, '# Test\n\nHello');

      const result = convertMarkdownFile(inputFile, outputFile);

      expect(result).toBe(outputFile);
      expect(fs.existsSync(outputFile)).toBe(true);

      const content = fs.readFileSync(outputFile, 'utf8');
      expect(content).toContain('<h1');
      expect(content).toContain('Test');
    });

    it('should throw error for non-existent input file', () => {
      expect(() => {
        convertMarkdownFile('/nonexistent/file.md', outputFile);
      }).toThrow('Input file not found');
    });

    it('should auto-generate title from filename', () => {
      const kebabFile = path.join(tempDir, 'my-awesome-doc.md');
      fs.writeFileSync(kebabFile, '# Test');

      convertMarkdownFile(kebabFile, outputFile);

      const content = fs.readFileSync(outputFile, 'utf8');
      expect(content).toContain('<title>My Awesome Doc</title>');

      fs.unlinkSync(kebabFile);
    });

    it('should use provided title over auto-generated', () => {
      const kebabFile = path.join(tempDir, 'my-awesome-doc.md');
      fs.writeFileSync(kebabFile, '# Test');

      convertMarkdownFile(kebabFile, outputFile, { title: 'Custom Title' });

      const content = fs.readFileSync(outputFile, 'utf8');
      expect(content).toContain('<title>Custom Title</title>');

      fs.unlinkSync(kebabFile);
    });

    it('should pass options to markdownToHtml', () => {
      fs.writeFileSync(inputFile, '# Test');

      convertMarkdownFile(inputFile, outputFile, {
        theme: 'dark',
        compactLevel: -5,
      });

      const content = fs.readFileSync(outputFile, 'utf8');
      expect(content).toContain("theme: 'dark'");
      expect(content).toContain('line-height: 1.3');
    });
  });
});
