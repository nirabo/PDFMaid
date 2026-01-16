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

function getStyles(theme = 'default', compactLevel = 0) {
  const isDark = theme === 'dark';

  // Clamp compactLevel to be within -5 and 5
  const level = Math.max(-5, Math.min(5, compactLevel));

  // Calculate dynamic values based on the compact level.
  // The formulas create a linear progression between the most compact and most spacious settings.
  const spacing = 1 + level * 0.15; // Base: 1, Step: 0.15 -> Range: [0.25, 1.75]
  const lineHeight = 1.6 + level * 0.06; // Base: 1.6, Step: 0.06 -> Range: [1.3, 1.9]
  const printFontSize = `${11 + level * 0.2}pt`; // Base: 11pt, Step: 0.2pt -> Range: [10pt, 12pt]
  const pageMargin = `${2 + level * 0.1}cm`; // Base: 2cm, Step: 0.1cm -> Range: [1.5cm, 2.5cm]

  return `<style>
    :root {
      --color-primary: ${isDark ? '#60a5fa' : '#2563eb'};
      --color-secondary: ${isDark ? '#94a3b8' : '#64748b'};
      --color-success: ${isDark ? '#34d399' : '#10b981'};
      --color-warning: ${isDark ? '#fbbf24' : '#f59e0b'};
      --color-danger: ${isDark ? '#f87171' : '#ef4444'};
      --color-bg: ${isDark ? '#0f172a' : '#ffffff'};
      --color-bg-alt: ${isDark ? '#1e293b' : '#f8fafc'};
      --color-border: ${isDark ? '#334155' : '#e2e8f0'};
      --color-text: ${isDark ? '#f1f5f9' : '#1e293b'};
      --color-text-muted: ${isDark ? '#94a3b8' : '#64748b'};
    }

    @media print {
      body {
        font-size: ${printFontSize};
        line-height: ${lineHeight - 0.2};
      }

      h1 {
        page-break-before: always;
      }

      h1:first-of-type {
        page-break-before: avoid;
      }

      h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }

      pre, blockquote, table, .mermaid {
        page-break-inside: avoid;
      }

      @page {
        margin: ${pageMargin};
        size: A4;
      }

      .print-button, .copy-button {
        display: none;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      line-height: ${lineHeight};
      color: var(--color-text);
      background: var(--color-bg);
      padding: ${2 * spacing}rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1, h2, h3, h4, h5, h6 {
      font-weight: 700;
      line-height: 1.3;
      margin-top: ${2 * spacing}rem;
      margin-bottom: ${1 * spacing}rem;
      color: var(--color-text);
    }

    h1 {
      font-size: 2.5rem;
      border-bottom: 3px solid var(--color-primary);
      padding-bottom: ${0.5 * spacing}rem;
      margin-top: 0;
    }

    h2 {
      font-size: 2rem;
      border-bottom: 2px solid var(--color-border);
      padding-bottom: ${0.3 * spacing}rem;
    }

    h3 {
      font-size: 1.5rem;
      color: var(--color-primary);
    }

    h4 {
      font-size: 1.25rem;
    }

    h5 {
      font-size: 1.1rem;
    }

    p {
      margin-bottom: ${1 * spacing}rem;
    }

    a {
      color: var(--color-primary);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    code {
      background: var(--color-bg-alt);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9em;
      color: var(--color-danger);
    }

    pre {
      background: var(--color-bg-alt);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: ${1 * spacing}rem;
      overflow-x: auto;
      margin-bottom: ${1 * spacing}rem;
    }

    pre code {
      background: transparent;
      padding: 0;
      color: var(--color-text);
      font-size: 0.875rem;
    }

    ul, ol {
      margin-bottom: ${1 * spacing}rem;
      padding-left: ${2 * spacing}rem;
    }

    li {
      margin-bottom: ${0.5 * spacing}rem;
    }

    blockquote {
      border-left: 4px solid var(--color-primary);
      padding-left: ${1 * spacing}rem;
      margin: ${1 * spacing}rem 0;
      color: var(--color-text-muted);
      font-style: italic;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: ${1 * spacing}rem;
      font-size: 0.9rem;
    }

    th, td {
      border: 1px solid var(--color-border);
      padding: ${0.75 * spacing}rem;
      text-align: left;
    }

    th {
      background: var(--color-bg-alt);
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: var(--color-bg-alt);
    }

    hr {
      border: none;
      border-top: 2px solid var(--color-border);
      margin: ${2 * spacing}rem 0;
    }

    .mermaid {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: ${2 * spacing}rem ${1 * spacing}rem;
      margin: ${2 * spacing}rem 0;
      display: flex;
      justify-content: center;
      overflow-x: auto;
    }

    /* Pre-rendered Mermaid diagrams (SVG) */
    .mermaid-container {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: ${1.5 * spacing}rem;
      margin: ${2 * spacing}rem 0;
      overflow-x: auto;
      text-align: center;
    }

    .mermaid-container svg.mermaid-prerendered {
      max-width: 100%;
      height: auto;
      display: inline-block;
    }

    /* Gantt charts and wide diagrams need special handling */
    .mermaid-container svg.mermaid-prerendered[data-diagram-type="gantt"],
    .mermaid-container svg.mermaid-prerendered[data-diagram-type="timeline"],
    .mermaid-container svg.mermaid-prerendered[data-diagram-type="gitgraph"] {
      max-width: none;
      width: auto;
    }

    @media print {
      .mermaid-container {
        page-break-inside: avoid;
        overflow: visible;
      }

      /* For print, allow Gantt charts to use their natural width */
      .mermaid-container svg.mermaid-prerendered[data-diagram-type="gantt"],
      .mermaid-container svg.mermaid-prerendered[data-diagram-type="timeline"] {
        max-width: none;
        width: auto;
        transform-origin: left top;
      }
    }

    /* Metadata styling */
    p strong {
      color: var(--color-primary);
    }

    /* Special styling for examples */
    pre[class*="language-"] {
      position: relative;
    }

    /* Table of contents styling */
    nav ol {
      list-style-position: inside;
    }

    nav a {
      font-weight: 500;
    }

    /* Print button */
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-primary);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      transition: background 0.2s;
    }

    .print-button:hover {
      background: ${isDark ? '#3b82f6' : '#1d4ed8'};
    }

    /* Copy button */
    .copy-button {
      position: absolute;
      top: 5px;
      right: 5px;
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    pre:hover .copy-button {
      opacity: 1;
    }

    .copy-button:hover {
      background: ${isDark ? '#3b82f6' : '#1d4ed8'};
    }

    /* Syntax highlighting for code blocks */
    .hljs-keyword { color: ${isDark ? '#ff79c6' : '#d73a49'}; }
    .hljs-string { color: ${isDark ? '#f1fa8c' : '#032f62'}; }
    .hljs-comment { color: ${isDark ? '#6272a4' : '#6a737d'}; font-style: italic; }
    .hljs-function { color: ${isDark ? '#bd93f9' : '#6f42c1'}; }
    .hljs-number { color: ${isDark ? '#8be9fd' : '#005cc5'}; }
  </style>`;
}

/**
 * Generate HTML template with Mermaid support
 * @param {string} content - HTML content to wrap
 * @param {object} options - Template options
 * @returns {string} Full HTML document
 */
function getHtmlTemplate(content, options = {}) {
  const {
    title = 'Document',
    theme = 'default',
    includeStyles = true,
    includePrintButton = true,
    compactLevel = 0, // Range from -5 (most compact) to 5 (most spacious)
  } = options;

  const mermaidTheme = theme === 'dark' ? 'dark' : 'default';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>

  <!-- Mermaid.js -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: '${mermaidTheme}',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  </script>

  ${includeStyles ? getStyles(theme, compactLevel) : ''}
</head>
<body>
  ${
    includePrintButton
      ? '<button class="print-button" onclick="window.print()">🖨️ Print / Save as PDF</button>'
      : ''
  }

  <article>
    ${content}
  </article>

  <script>
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Add copy button to code blocks
    document.querySelectorAll('pre code').forEach((block) => {
      // Skip mermaid blocks
      if (block.parentElement.parentElement.classList.contains('mermaid')) {
        return;
      }

      const button = document.createElement('button');
      button.textContent = 'Copy';
      button.className = 'copy-button';

      button.addEventListener('click', () => {
        navigator.clipboard.writeText(block.textContent);
        button.textContent = 'Copied!';
        setTimeout(() => button.textContent = 'Copy', 2000);
      });

      block.parentElement.style.position = 'relative';
      block.parentElement.appendChild(button);
    });
  </script>
</body>
</html>`;
}

module.exports = {
  getHtmlTemplate,
  getStyles,
};
