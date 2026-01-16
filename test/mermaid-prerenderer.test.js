const {
  detectDiagramType,
  getViewportForDiagramType,
  extractMermaidBlocks,
  isPuppeteerAvailable,
} = require('../lib/mermaid-prerenderer');

describe('mermaid-prerenderer', () => {
  describe('detectDiagramType', () => {
    it('should detect gantt diagrams', () => {
      expect(detectDiagramType('gantt\n  title A Gantt Diagram')).toBe('gantt');
      expect(detectDiagramType('Gantt\n  title Test')).toBe('gantt');
    });

    it('should detect sequence diagrams', () => {
      expect(detectDiagramType('sequenceDiagram\n  A->>B: Hello')).toBe(
        'sequence',
      );
      expect(detectDiagramType('sequence\n  A->>B: Test')).toBe('sequence');
    });

    it('should detect flowchart diagrams', () => {
      expect(detectDiagramType('flowchart TD\n  A-->B')).toBe('flowchart');
      expect(detectDiagramType('graph LR\n  A-->B')).toBe('flowchart');
      expect(detectDiagramType('flowchart LR\n  A-->B')).toBe('flowchart');
    });

    it('should detect class diagrams', () => {
      expect(detectDiagramType('classDiagram\n  class Animal')).toBe('class');
      expect(detectDiagramType('class\n  Animal <|-- Dog')).toBe('class');
    });

    it('should detect state diagrams', () => {
      expect(detectDiagramType('stateDiagram-v2\n  [*] --> Still')).toBe(
        'state',
      );
      expect(detectDiagramType('state\n  [*] --> Active')).toBe('state');
    });

    it('should detect ER diagrams', () => {
      expect(detectDiagramType('erDiagram\n  CUSTOMER ||--o{ ORDER')).toBe(
        'er',
      );
      expect(detectDiagramType('er\n  CUSTOMER ||--o{ ORDER')).toBe('er');
    });

    it('should detect journey diagrams', () => {
      expect(detectDiagramType('journey\n  title My journey')).toBe('journey');
    });

    it('should detect pie charts', () => {
      expect(detectDiagramType('pie\n  "Dogs" : 386')).toBe('pie');
      expect(detectDiagramType('pie showData\n  title Pets')).toBe('pie');
    });

    it('should detect git graphs', () => {
      expect(detectDiagramType('gitGraph\n  commit')).toBe('gitgraph');
      expect(detectDiagramType('git\n  commit')).toBe('gitgraph');
    });

    it('should detect timeline diagrams', () => {
      expect(detectDiagramType('timeline\n  title History')).toBe('timeline');
    });

    it('should detect mindmap diagrams', () => {
      expect(detectDiagramType('mindmap\n  root((mindmap))')).toBe('mindmap');
    });

    it('should detect quadrant charts', () => {
      expect(detectDiagramType('quadrantChart\n  title Chart')).toBe(
        'quadrant',
      );
      expect(detectDiagramType('quadrant\n  title Test')).toBe('quadrant');
    });

    it('should default to flowchart for unknown types', () => {
      expect(detectDiagramType('unknown\n  A-->B')).toBe('flowchart');
      expect(detectDiagramType('')).toBe('flowchart');
    });

    it('should handle whitespace', () => {
      expect(detectDiagramType('  gantt\n  title Test')).toBe('gantt');
      expect(detectDiagramType('\n\nflowchart TD')).toBe('flowchart');
    });
  });

  describe('getViewportForDiagramType', () => {
    it('should return wide viewport for gantt charts', () => {
      const viewport = getViewportForDiagramType(
        'gantt',
        'gantt\n  title Test',
      );
      expect(viewport.width).toBeGreaterThanOrEqual(1800);
      expect(viewport.height).toBeGreaterThanOrEqual(600);
    });

    it('should return extra wide viewport for gantt charts with many tasks', () => {
      const manyTasks = `gantt
        title Project Plan
        section Phase 1
        Task 1: a1, 2024-01-01, 7d
        Task 2: a2, after a1, 5d
        Task 3: a3, after a2, 3d
        Task 4: a4, after a3, 4d
        Task 5: a5, after a4, 6d
        section Phase 2
        Task 6: b1, 2024-02-01, 7d
        Task 7: b2, after b1, 5d
        Task 8: b3, after b2, 3d
        Task 9: b4, after b3, 4d
        Task 10: b5, after b4, 6d
        Task 11: c1, after b5, 7d
        Task 12: c2, after c1, 5d
        Task 13: c3, after c2, 3d
        Task 14: c4, after c3, 4d
        Task 15: c5, after c4, 6d
        Task 16: d1, after c5, 7d`;
      const viewport = getViewportForDiagramType('gantt', manyTasks);
      expect(viewport.width).toBeGreaterThanOrEqual(2000);
    });

    it('should return wide viewport for timeline diagrams', () => {
      const viewport = getViewportForDiagramType(
        'timeline',
        'timeline\n  title History',
      );
      expect(viewport.width).toBeGreaterThanOrEqual(1600);
    });

    it('should return standard viewport for flowcharts', () => {
      const viewport = getViewportForDiagramType(
        'flowchart',
        'flowchart TD\n  A-->B',
      );
      expect(viewport.width).toBe(1200);
      expect(viewport.height).toBe(800);
    });

    it('should return compact viewport for pie charts', () => {
      const viewport = getViewportForDiagramType('pie', 'pie\n  "A": 50');
      expect(viewport.width).toBe(800);
    });

    it('should return default viewport for unknown types', () => {
      const viewport = getViewportForDiagramType('unknown', 'unknown');
      expect(viewport.width).toBe(1200);
      expect(viewport.height).toBe(800);
    });
  });

  describe('extractMermaidBlocks', () => {
    it('should extract mermaid code blocks', () => {
      const markdown = `# Title

Some text

\`\`\`mermaid
flowchart TD
  A-->B
\`\`\`

More text`;

      const blocks = extractMermaidBlocks(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].definition).toBe('flowchart TD\n  A-->B');
    });

    it('should extract multiple mermaid blocks', () => {
      const markdown = `# Title

\`\`\`mermaid
gantt
  title Plan
\`\`\`

\`\`\`mermaid
pie
  "A": 50
\`\`\``;

      const blocks = extractMermaidBlocks(markdown);
      expect(blocks).toHaveLength(2);
      expect(blocks[0].definition).toContain('gantt');
      expect(blocks[1].definition).toContain('pie');
    });

    it('should return empty array when no mermaid blocks', () => {
      const markdown = `# Title

\`\`\`javascript
const x = 1;
\`\`\``;

      const blocks = extractMermaidBlocks(markdown);
      expect(blocks).toHaveLength(0);
    });

    it('should handle empty markdown', () => {
      const blocks = extractMermaidBlocks('');
      expect(blocks).toHaveLength(0);
    });

    it('should capture the full match and index', () => {
      const markdown = `Text\n\`\`\`mermaid\ngraph TD\n\`\`\`\nMore`;
      const blocks = extractMermaidBlocks(markdown);
      expect(blocks[0].match).toBe('```mermaid\ngraph TD\n```');
      expect(blocks[0].index).toBe(5);
    });

    it('should handle mermaid blocks with extra whitespace', () => {
      const markdown = `\`\`\`mermaid
flowchart LR
  A --> B
\`\`\``;

      const blocks = extractMermaidBlocks(markdown);
      expect(blocks).toHaveLength(1);
    });
  });

  describe('isPuppeteerAvailable', () => {
    it('should return true when puppeteer is installed', () => {
      expect(isPuppeteerAvailable()).toBe(true);
    });
  });
});
