const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('../lib/mermaid-prerenderer', () => ({
  isPuppeteerAvailable: jest.fn(() => true),
  prerenderMermaidDiagrams: jest.fn((markdown) =>
    Promise.resolve(`<!-- prerendered -->\n${markdown}`),
  ),
}));

const {
  markdownToHtmlAsync,
  convertMarkdownFileAsync,
} = require('../lib/converter');
const {
  isPuppeteerAvailable,
  prerenderMermaidDiagrams,
} = require('../lib/mermaid-prerenderer');

describe('converter async', () => {
  afterEach(() => {
    jest.clearAllMocks();
    isPuppeteerAvailable.mockReturnValue(true);
  });

  describe('markdownToHtmlAsync', () => {
    it('should pre-render diagrams and wrap them in the template', async () => {
      const html = await markdownToHtmlAsync('# Title', { theme: 'dark' });

      expect(prerenderMermaidDiagrams).toHaveBeenCalledWith('# Title', {
        theme: 'dark',
      });
      expect(html).toContain('<!-- prerendered -->');
      expect(html).toContain('<h1>Title</h1>');
      expect(html).toContain("theme: 'dark'");
    });

    it('should skip pre-rendering when Puppeteer is unavailable', async () => {
      isPuppeteerAvailable.mockReturnValue(false);

      const html = await markdownToHtmlAsync('# Title');

      expect(prerenderMermaidDiagrams).not.toHaveBeenCalled();
      expect(html).toContain('<h1>Title</h1>');
    });

    it('should skip pre-rendering when prerender is false', async () => {
      const html = await markdownToHtmlAsync('# Title', { prerender: false });

      expect(prerenderMermaidDiagrams).not.toHaveBeenCalled();
      expect(html).toContain('<h1>Title</h1>');
    });

    it('should convert any leftover mermaid blocks to divs', async () => {
      prerenderMermaidDiagrams.mockResolvedValueOnce(
        '```mermaid\ngraph TD\nA-->B\n```',
      );

      const html = await markdownToHtmlAsync(
        '```mermaid\ngraph TD\nA-->B\n```',
      );

      expect(html).toContain('<div class="mermaid">');
      expect(html).not.toContain('language-mermaid');
    });
  });

  describe('convertMarkdownFileAsync', () => {
    let tempDir;
    let inputFile;
    let outputFile;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfmaid-async-'));
      inputFile = path.join(tempDir, 'my-awesome-doc.md');
      outputFile = path.join(tempDir, 'out.html');
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should convert a markdown file and auto-generate the title', async () => {
      fs.writeFileSync(inputFile, '# Test');

      const result = await convertMarkdownFileAsync(inputFile, outputFile);

      expect(result).toBe(outputFile);
      const content = fs.readFileSync(outputFile, 'utf8');
      expect(content).toContain('<title>My Awesome Doc</title>');
    });

    it('should use provided options over auto-generated values', async () => {
      fs.writeFileSync(inputFile, '# Test');

      await convertMarkdownFileAsync(inputFile, outputFile, {
        title: 'Custom Title',
        theme: 'dark',
      });

      const content = fs.readFileSync(outputFile, 'utf8');
      expect(content).toContain('<title>Custom Title</title>');
      expect(content).toContain("theme: 'dark'");
    });

    it('should throw an error for a non-existent input file', async () => {
      await expect(
        convertMarkdownFileAsync(path.join(tempDir, 'missing.md'), outputFile),
      ).rejects.toThrow('Input file not found');
    });
  });
});
