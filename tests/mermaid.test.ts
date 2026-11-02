import fs from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  detectDiagramType,
  extractMermaidBlocks,
  getViewportForDiagramType,
  mermaidConfig,
  mermaidScriptPath,
} from '../src/mermaid.js';

describe('mermaid helpers', () => {
  test.each([
    ['gantt\n title x', 'gantt'],
    ['sequenceDiagram\nA->>B: hi', 'sequence'],
    ['graph TD\nA-->B', 'flowchart'],
    ['classDiagram', 'class'],
    ['stateDiagram-v2', 'state'],
    ['erDiagram', 'er'],
    ['pie title x', 'pie'],
    ['gitGraph', 'gitgraph'],
    ['something else', 'flowchart'],
  ])('detects %j as %s', (definition, type) => {
    expect(detectDiagramType(definition)).toBe(type);
  });

  test('gantt viewports grow with tasks and long timelines', () => {
    const tasks = Array.from({ length: 16 }, (_, i) => `t${i} :a${i}, 1d`);
    expect(getViewportForDiagramType('gantt', 'gantt').width).toBe(1800);
    expect(
      getViewportForDiagramType('gantt', ['gantt', ...tasks].join('\n')).width,
    ).toBe(2200);
    expect(
      getViewportForDiagramType('gantt', 'gantt\n t :a, 2 weeks').width,
    ).toBe(2000);
    expect(getViewportForDiagramType('pie', 'pie').width).toBe(800);
  });

  test('extracts fenced mermaid blocks with their positions', () => {
    const md = 'a\n```mermaid\ngraph TD\n```\nb\n```mermaid\npie\n```';
    const blocks = extractMermaidBlocks(md);
    expect(blocks.map((b) => b.definition)).toEqual(['graph TD', 'pie']);
    expect(md.indexOf(blocks[0]?.match ?? '!')).toBe(blocks[0]?.index);
  });

  test('maps document themes and ships the bundle', () => {
    expect(mermaidConfig('dark').theme).toBe('dark');
    expect(mermaidConfig('paper').theme).toBe('neutral');
    expect(fs.existsSync(mermaidScriptPath())).toBe(true);
  });
});
