import { createRequire } from 'node:module';
import type { Browser, Page } from 'puppeteer-core';
import { escapeHtml, mermaidThemeFor } from './theme/template.js';

const require = createRequire(import.meta.url);

export type DiagramType =
  | 'gantt'
  | 'sequence'
  | 'flowchart'
  | 'class'
  | 'state'
  | 'er'
  | 'journey'
  | 'pie'
  | 'gitgraph'
  | 'timeline'
  | 'mindmap'
  | 'quadrant';

export interface Viewport {
  width: number;
  height: number;
}

export interface MermaidBlock {
  match: string;
  definition: string;
  index: number;
}

/** Absolute path of the Mermaid bundle shipped with this package. */
export function mermaidScriptPath(): string {
  return require.resolve('mermaid/dist/mermaid.min.js');
}

const DIAGRAM_PREFIXES: Array<[string, DiagramType]> = [
  ['gantt', 'gantt'],
  ['sequence', 'sequence'],
  ['flowchart', 'flowchart'],
  ['graph', 'flowchart'],
  ['class', 'class'],
  ['state', 'state'],
  ['er', 'er'],
  ['journey', 'journey'],
  ['pie', 'pie'],
  ['git', 'gitgraph'],
  ['timeline', 'timeline'],
  ['mindmap', 'mindmap'],
  ['quadrant', 'quadrant'],
];

/** Detect the type of a Mermaid diagram from its first token. */
export function detectDiagramType(definition: string): DiagramType {
  const text = definition.trim().toLowerCase();
  const hit = DIAGRAM_PREFIXES.find(([prefix]) => text.startsWith(prefix));
  return hit ? hit[1] : 'flowchart';
}

const VIEWPORTS: Record<DiagramType, Viewport> = {
  gantt: { width: 1800, height: 800 },
  timeline: { width: 1600, height: 600 },
  gitgraph: { width: 1400, height: 600 },
  sequence: { width: 1200, height: 800 },
  flowchart: { width: 1200, height: 800 },
  class: { width: 1200, height: 800 },
  state: { width: 1200, height: 800 },
  er: { width: 1400, height: 800 },
  journey: { width: 1400, height: 600 },
  pie: { width: 800, height: 600 },
  mindmap: { width: 1400, height: 800 },
  quadrant: { width: 800, height: 800 },
};

/** Pick a viewport wide enough for the diagram (Gantt charts grow with tasks). */
export function getViewportForDiagramType(
  diagramType: DiagramType,
  definition: string,
): Viewport {
  const config = { ...VIEWPORTS[diagramType] };
  if (diagramType !== 'gantt') return config;

  const taskCount = definition.split('\n').filter((line) => {
    const t = line.trim().toLowerCase();
    return (
      t.includes(':') &&
      !t.startsWith('title') &&
      !t.startsWith('dateformat') &&
      !t.startsWith('section')
    );
  }).length;
  if (taskCount > 15) config.width = 2200;
  else if (taskCount > 10) config.width = 2000;

  const dates = definition.match(/\d{4}-\d{2}-\d{2}/g)?.length ?? 0;
  if (definition.toLowerCase().includes('weeks') || dates > 4) {
    config.width = Math.max(config.width, 2000);
  }
  return config;
}

/** Extract ```mermaid fenced blocks from Markdown. */
export function extractMermaidBlocks(markdown: string): MermaidBlock[] {
  const blocks: MermaidBlock[] = [];
  for (const m of markdown.matchAll(/```mermaid\s*\n([\s\S]*?)```/gi)) {
    blocks.push({
      match: m[0],
      definition: (m[1] ?? '').trim(),
      index: m.index ?? 0,
    });
  }
  return blocks;
}

/** Mermaid configuration shared by the in-page and the standalone renderer. */
export function mermaidConfig(theme: string, width = 1200) {
  return {
    startOnLoad: false,
    theme: mermaidThemeFor(theme),
    securityLevel: 'strict',
    flowchart: { useMaxWidth: true, htmlLabels: true },
    gantt: { useMaxWidth: true, useWidth: width - 200 },
    sequence: { useMaxWidth: true },
    journey: { useMaxWidth: true },
    timeline: { useMaxWidth: true },
    gitGraph: { useMaxWidth: true },
  };
}

/**
 * Inject Mermaid into a page and render every `.mermaid` element in place.
 * @returns The number of diagrams that failed to render.
 */
export async function renderMermaidInPage(
  page: Page,
  theme: string,
): Promise<number> {
  await page.addScriptTag({ path: mermaidScriptPath() });
  return page.evaluate(async (config) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mermaid = (window as any).mermaid;
    mermaid.initialize(config);
    await mermaid.run({ querySelector: '.mermaid', suppressErrors: true });
    return document.querySelectorAll('.mermaid:not([data-processed])').length;
  }, mermaidConfig(theme));
}

/** Render one diagram to a standalone SVG string. */
export async function renderDiagramToSvg(
  browser: Browser,
  definition: string,
  options: { theme?: string } = {},
): Promise<string> {
  const { theme = 'default' } = options;
  const diagramType = detectDiagramType(definition);
  const viewport = getViewportForDiagramType(diagramType, definition);

  const page = await browser.newPage();
  try {
    await page.setViewport({ ...viewport, deviceScaleFactor: 2 });
    await page.setContent(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        body { margin: 0; padding: 20px; background: transparent; width: ${viewport.width}px; }
        #container { display: inline-block; min-width: ${viewport.width - 40}px; }
      </style></head><body><div id="container"><pre class="mermaid">${escapeHtml(definition)}</pre></div></body></html>`,
    );
    await page.addScriptTag({ path: mermaidScriptPath() });
    const config = mermaidConfig(theme, viewport.width);
    await page.evaluate(async (cfg) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mermaid = (window as any).mermaid;
      mermaid.initialize(cfg);
      await mermaid.run({ querySelector: '.mermaid' });
    }, config);

    const svgElement = await page.$('#container svg');
    if (!svgElement) throw new Error('SVG element not found after rendering');
    const box = await svgElement.boundingBox();
    let svg = await page.evaluate(() => {
      const el = document.querySelector('#container svg');
      el?.removeAttribute('style');
      return el?.outerHTML ?? null;
    });
    if (!svg) throw new Error('Failed to extract SVG content');

    if (box) {
      const width = Math.ceil(box.width);
      const height = Math.ceil(box.height);
      if (!svg.includes('viewBox')) {
        svg = svg.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
      }
      svg = svg.replace('<svg', `<svg width="${width}" height="${height}"`);
    }
    return svg.replace(
      '<svg',
      `<svg class="mermaid-prerendered" data-diagram-type="${diagramType}"`,
    );
  } finally {
    await page.close();
  }
}

/**
 * Replace every ```mermaid block of a Markdown document with its rendered
 * SVG. Diagrams that fail to render are kept as code and reported.
 */
export async function prerenderMermaidDiagrams(
  markdown: string,
  options: { theme?: string; browser: Browser; warnings?: string[] },
): Promise<string> {
  const { theme = 'default', browser, warnings = [] } = options;
  const blocks = extractMermaidBlocks(markdown);
  let result = markdown;

  // Back to front so earlier indices stay valid.
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const block = blocks[i];
    if (!block) continue;
    try {
      const svg = await renderDiagramToSvg(browser, block.definition, {
        theme,
      });
      result =
        result.slice(0, block.index) +
        `<div class="mermaid-container">\n${svg}\n</div>` +
        result.slice(block.index + block.match.length);
    } catch (error) {
      warnings.push(
        `Failed to pre-render diagram ${i + 1}: ${(error as Error).message}`,
      );
    }
  }
  return result;
}
