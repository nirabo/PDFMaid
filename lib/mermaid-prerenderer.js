// Lazy load puppeteer to avoid issues with Jest and to make the module
// usable even when puppeteer is not installed (for pure utility functions)
let puppeteer = null;

function getPuppeteer() {
  if (!puppeteer) {
    // eslint-disable-next-line global-require
    puppeteer = require('puppeteer');
  }
  return puppeteer;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Detect the type of Mermaid diagram from its definition
 * @param {string} definition - Mermaid diagram definition
 * @returns {string} Diagram type
 */
function detectDiagramType(definition) {
  const trimmed = definition.trim().toLowerCase();

  if (trimmed.startsWith('gantt')) return 'gantt';
  if (trimmed.startsWith('sequencediagram') || trimmed.startsWith('sequence'))
    return 'sequence';
  if (trimmed.startsWith('flowchart') || trimmed.startsWith('graph'))
    return 'flowchart';
  if (trimmed.startsWith('classDiagram') || trimmed.startsWith('class'))
    return 'class';
  if (trimmed.startsWith('statediagram') || trimmed.startsWith('state'))
    return 'state';
  if (trimmed.startsWith('erdiagram') || trimmed.startsWith('er')) return 'er';
  if (trimmed.startsWith('journey')) return 'journey';
  if (trimmed.startsWith('pie')) return 'pie';
  if (trimmed.startsWith('gitgraph') || trimmed.startsWith('git'))
    return 'gitgraph';
  if (trimmed.startsWith('timeline')) return 'timeline';
  if (trimmed.startsWith('mindmap')) return 'mindmap';
  if (trimmed.startsWith('quadrantchart') || trimmed.startsWith('quadrant'))
    return 'quadrant';

  return 'flowchart'; // Default
}

/**
 * Get optimal viewport width based on diagram type
 * @param {string} diagramType - Type of diagram
 * @param {string} definition - Diagram definition (for analysis)
 * @returns {object} Viewport configuration { width, height }
 */
function getViewportForDiagramType(diagramType, definition) {
  // Base configurations for different diagram types
  const configs = {
    gantt: { width: 1800, height: 800 }, // Gantt needs wide viewport
    timeline: { width: 1600, height: 600 }, // Timeline also needs width
    gitgraph: { width: 1400, height: 600 }, // Git graphs can be wide
    sequence: { width: 1200, height: 800 }, // Sequence diagrams grow tall
    flowchart: { width: 1200, height: 800 },
    class: { width: 1200, height: 800 },
    state: { width: 1200, height: 800 },
    er: { width: 1400, height: 800 },
    journey: { width: 1400, height: 600 },
    pie: { width: 800, height: 600 },
    mindmap: { width: 1400, height: 800 },
    quadrant: { width: 800, height: 800 },
  };

  const config = configs[diagramType] || { width: 1200, height: 800 };

  // For Gantt charts, analyze the definition to estimate width needs
  if (diagramType === 'gantt') {
    // Count sections and tasks to estimate needed width
    const lines = definition.split('\n');
    const taskCount = lines.filter(
      (line) =>
        line.includes(':') &&
        !line.trim().startsWith('title') &&
        !line.trim().startsWith('dateformat') &&
        !line.trim().startsWith('section'),
    ).length;

    // More tasks = potentially longer timeline = wider viewport
    if (taskCount > 15) {
      config.width = 2200;
    } else if (taskCount > 10) {
      config.width = 2000;
    }

    // Check for date ranges that might indicate long timelines
    const hasWeeks =
      definition.toLowerCase().includes('weeks') ||
      definition.match(/\d{4}-\d{2}-\d{2}/g)?.length > 4;
    if (hasWeeks) {
      config.width = Math.max(config.width, 2000);
    }
  }

  return config;
}

/**
 * Extract mermaid code blocks from markdown content
 * @param {string} markdown - Markdown content
 * @returns {Array<{match: string, definition: string, index: number}>} Extracted mermaid blocks
 */
function extractMermaidBlocks(markdown) {
  const blocks = [];
  // Match ```mermaid ... ``` blocks
  const regex = /```mermaid\s*\n([\s\S]*?)```/gi;

  let match = regex.exec(markdown);
  while (match !== null) {
    blocks.push({
      match: match[0],
      definition: match[1].trim(),
      index: match.index,
    });
    match = regex.exec(markdown);
  }

  return blocks;
}

/**
 * Render a single Mermaid diagram to SVG using Puppeteer
 * @param {object} browser - Puppeteer browser instance
 * @param {string} definition - Mermaid diagram definition
 * @param {object} options - Rendering options
 * @returns {Promise<string>} Rendered SVG string
 */
async function renderDiagramToSvg(browser, definition, options = {}) {
  const { theme = 'default' } = options;

  const diagramType = detectDiagramType(definition);
  const viewport = getViewportForDiagramType(diagramType, definition);

  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 2, // Higher quality rendering
    });

    const mermaidTheme = theme === 'dark' ? 'dark' : 'default';

    // Calculate Gantt-specific width based on viewport
    const ganttSectionWidth =
      diagramType === 'gantt' ? viewport.width - 200 : 600;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 20px;
      background: transparent;
      width: ${viewport.width}px;
    }
    #container {
      display: inline-block;
      min-width: ${viewport.width - 40}px;
    }
    .mermaid {
      min-width: ${viewport.width - 40}px;
    }
    /* Force Gantt charts to use full width */
    .mermaid svg {
      min-width: ${viewport.width - 100}px !important;
    }
  </style>
</head>
<body>
  <div id="container">
    <pre class="mermaid">${escapeHtml(definition)}</pre>
  </div>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: '${mermaidTheme}',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: false, htmlLabels: true },
      gantt: {
        useMaxWidth: false,
        barHeight: 30,
        barGap: 8,
        topPadding: 60,
        leftPadding: 150,
        rightPadding: 50,
        gridLineStartPadding: 35,
        fontSize: 14,
        sectionFontSize: 14,
        numberSectionStyles: 4,
        axisFormat: '%Y-%m-%d',
        tickInterval: '1 week',
        useWidth: ${ganttSectionWidth}
      },
      sequence: { useMaxWidth: false },
      journey: { useMaxWidth: false },
      timeline: { useMaxWidth: false },
      gitGraph: { useMaxWidth: false }
    });
  </script>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for Mermaid to render
    await page.waitForSelector('svg', { timeout: 10000 });

    // Additional wait for complex diagrams
    await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    });

    // Extract the SVG
    const svgElement = await page.$('#container svg');
    if (!svgElement) {
      throw new Error('SVG element not found after rendering');
    }

    // Get the SVG's bounding box to determine actual size
    const boundingBox = await svgElement.boundingBox();

    // Get SVG outer HTML and enhance it
    // eslint-disable-next-line no-undef
    let svg = await page.evaluate(() => {
      const svgEl = document.querySelector('#container svg'); // eslint-disable-line no-undef
      if (!svgEl) return null;

      // Remove any fixed width/height attributes that might constrain it
      svgEl.removeAttribute('style');

      return svgEl.outerHTML;
    });

    if (!svg) {
      throw new Error('Failed to extract SVG content');
    }

    // Add viewBox if not present and set appropriate dimensions
    if (boundingBox) {
      const width = Math.ceil(boundingBox.width);
      const height = Math.ceil(boundingBox.height);

      // Ensure SVG has proper viewBox and dimensions for scaling
      if (!svg.includes('viewBox')) {
        svg = svg.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
      }

      // Add width/height for proper sizing in the document
      svg = svg.replace('<svg', `<svg width="${width}" height="${height}"`);
    }

    // Add a class for styling
    svg = svg.replace(
      '<svg',
      `<svg class="mermaid-prerendered" data-diagram-type="${diagramType}"`,
    );

    return svg;
  } finally {
    await page.close();
  }
}

/**
 * Pre-render all Mermaid diagrams in markdown content
 * @param {string} markdown - Markdown content with mermaid blocks
 * @param {object} options - Rendering options
 * @returns {Promise<string>} Markdown with mermaid blocks replaced by rendered SVGs
 */
async function prerenderMermaidDiagrams(markdown, options = {}) {
  const { theme = 'default' } = options;

  const blocks = extractMermaidBlocks(markdown);

  if (blocks.length === 0) {
    return markdown;
  }

  let browser;
  try {
    const pptr = getPuppeteer();
    browser = await pptr.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    let result = markdown;

    // Process blocks in reverse order to maintain correct indices
    // eslint-disable-next-line no-plusplus
    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i];

      try {
        // eslint-disable-next-line no-await-in-loop
        const svg = await renderDiagramToSvg(browser, block.definition, {
          theme,
        });

        // Wrap SVG in a div for styling
        const wrappedSvg = `<div class="mermaid-container">\n${svg}\n</div>`;

        // Replace the mermaid code block with the rendered SVG
        result =
          result.substring(0, block.index) +
          wrappedSvg +
          result.substring(block.index + block.match.length);
      } catch (error) {
        console.error(
          `Warning: Failed to pre-render diagram ${i + 1}: ${error.message}`,
        );
        // Keep the original mermaid block if rendering fails
      }
    }

    return result;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Check if Puppeteer is available
 * @returns {boolean} True if Puppeteer can be used
 */
function isPuppeteerAvailable() {
  try {
    require.resolve('puppeteer');
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  detectDiagramType,
  getViewportForDiagramType,
  extractMermaidBlocks,
  renderDiagramToSvg,
  prerenderMermaidDiagrams,
  isPuppeteerAvailable,
};
