const mockPage = {
  setViewport: jest.fn(),
  setContent: jest.fn(),
  waitForSelector: jest.fn(),
  evaluate: jest.fn(),
  $: jest.fn(),
  close: jest.fn(),
};
const mockBrowser = {
  newPage: jest.fn(() => mockPage),
  close: jest.fn(),
};
const mockLaunch = jest.fn(() => Promise.resolve(mockBrowser));

jest.mock('puppeteer', () => ({ launch: mockLaunch }));

const {
  renderDiagramToSvg,
  prerenderMermaidDiagrams,
} = require('../lib/mermaid-prerenderer');

function elementWithBox(box) {
  return { boundingBox: jest.fn().mockResolvedValue(box) };
}

function setupPage({ svg = '<svg></svg>', element } = {}) {
  mockPage.setViewport.mockResolvedValue();
  mockPage.setContent.mockResolvedValue();
  mockPage.waitForSelector.mockResolvedValue();
  mockPage.close.mockResolvedValue();
  mockPage.evaluate
    .mockReset()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(svg);
  mockPage.$ = jest
    .fn()
    .mockResolvedValue(
      element === undefined
        ? elementWithBox({ width: 120.4, height: 60.2 })
        : element,
    );
}

describe('mermaid-prerenderer rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBrowser.newPage.mockReturnValue(mockPage);
    mockLaunch.mockResolvedValue(mockBrowser);
    setupPage();
  });

  describe('renderDiagramToSvg', () => {
    it('should return an enhanced SVG with sizing and metadata', async () => {
      const svg = await renderDiagramToSvg(mockBrowser, 'graph TD\nA-->B');

      expect(svg).toContain('class="mermaid-prerendered"');
      expect(svg).toContain('data-diagram-type="flowchart"');
      expect(svg).toContain('viewBox="0 0 121 61"');
      expect(svg).toContain('width="121"');
      expect(svg).toContain('height="61"');
      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should keep an existing viewBox', async () => {
      setupPage({ svg: '<svg viewBox="0 0 10 10"></svg>' });

      const svg = await renderDiagramToSvg(mockBrowser, 'pie\n"A": 1');

      expect(svg).toContain('viewBox="0 0 10 10"');
      expect(svg).not.toContain('viewBox="0 0 121 61"');
      expect(svg).toContain('width="121"');
    });

    it('should render a neutral theme for the paper theme', async () => {
      await renderDiagramToSvg(mockBrowser, 'graph TD\nA-->B', {
        theme: 'paper',
      });

      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining("theme: 'neutral'"),
        { waitUntil: 'networkidle0' },
      );
    });

    it('should throw when the SVG element is missing', async () => {
      setupPage({ element: null });

      await expect(
        renderDiagramToSvg(mockBrowser, 'graph TD\nA-->B'),
      ).rejects.toThrow('SVG element not found after rendering');
      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should throw when the SVG cannot be extracted', async () => {
      setupPage({ svg: null });

      await expect(
        renderDiagramToSvg(mockBrowser, 'graph TD\nA-->B'),
      ).rejects.toThrow('Failed to extract SVG content');
    });

    it('should return the SVG without dimensions when there is no box', async () => {
      setupPage({ element: elementWithBox(null) });

      const svg = await renderDiagramToSvg(mockBrowser, 'graph TD\nA-->B');

      expect(svg).toContain('class="mermaid-prerendered"');
      expect(svg).not.toContain('width="121"');
    });
  });

  describe('prerenderMermaidDiagrams', () => {
    it('should return the markdown unchanged when there are no diagrams', async () => {
      const markdown = '# No diagrams here';

      await expect(prerenderMermaidDiagrams(markdown)).resolves.toBe(markdown);
      expect(mockLaunch).not.toHaveBeenCalled();
    });

    it('should replace mermaid blocks with rendered SVG containers', async () => {
      const markdown = 'Before\n\n```mermaid\ngraph TD\nA-->B\n```\n\nAfter';

      const result = await prerenderMermaidDiagrams(markdown, {
        theme: 'paper',
      });

      expect(result).toContain('<div class="mermaid-container">');
      expect(result).toContain('class="mermaid-prerendered"');
      expect(result).not.toContain('```mermaid');
      expect(result).toContain('Before');
      expect(result).toContain('After');
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should keep the original block when rendering fails', async () => {
      const markdown = '```mermaid\ngraph TD\nA-->B\n```';
      mockPage.setContent.mockRejectedValueOnce(new Error('boom'));
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await prerenderMermaidDiagrams(markdown);

      expect(result).toBe(markdown);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to pre-render diagram'),
      );
      errorSpy.mockRestore();
    });
  });
});
