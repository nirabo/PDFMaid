const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { getHtmlTemplate } = require('./template');
const {
  prerenderMermaidDiagrams,
  isPuppeteerAvailable,
} = require('./mermaid-prerenderer');

/**
 * Convert Markdown to HTML with Mermaid diagram support
 * @param {string} markdown - The markdown content
 * @param {object} options - Conversion options
 * @returns {string} HTML content
 */
function markdownToHtml(markdown, options = {}) {
  const {
    title = 'Document',
    theme = 'default',
    includeStyles = true,
    includePrintButton = true,
    compactLevel = 0,
    prerender = false,
  } = options;

  // Configure marked options
  marked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
  });

  // Convert markdown to HTML
  let htmlContent = marked.parse(markdown);

  // Post-process: Convert mermaid code blocks to mermaid divs
  // This handles the case where marked wraps them in <pre><code class="language-mermaid">
  // Skip if prerender is enabled (diagrams are already rendered as SVG)
  if (!prerender) {
    htmlContent = htmlContent.replace(
      /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
      '<div class="mermaid">$1</div>',
    );
  }

  // Wrap in full HTML template
  return getHtmlTemplate(htmlContent, {
    title,
    theme,
    includeStyles,
    includePrintButton,
    compactLevel,
    prerender,
  });
}

/**
 * Convert Markdown to HTML with Mermaid diagram support (async version with pre-rendering)
 * @param {string} markdown - The markdown content
 * @param {object} options - Conversion options
 * @returns {Promise<string>} HTML content
 */
async function markdownToHtmlAsync(markdown, options = {}) {
  const {
    title = 'Document',
    theme = 'default',
    includeStyles = true,
    includePrintButton = true,
    compactLevel = 0,
    prerender = true,
  } = options;

  let processedMarkdown = markdown;

  // Pre-render Mermaid diagrams if enabled
  if (prerender && isPuppeteerAvailable()) {
    processedMarkdown = await prerenderMermaidDiagrams(markdown, { theme });
  }

  // Configure marked options
  marked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
  });

  // Convert markdown to HTML
  let htmlContent = marked.parse(processedMarkdown);

  // Post-process: Convert any remaining mermaid code blocks to mermaid divs
  // (in case some diagrams failed to pre-render)
  htmlContent = htmlContent.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    '<div class="mermaid">$1</div>',
  );

  // Wrap in full HTML template
  return getHtmlTemplate(htmlContent, {
    title,
    theme,
    includeStyles,
    includePrintButton,
    compactLevel,
    prerender,
  });
}

/**
 * Convert Markdown file to HTML file
 * @param {string} inputPath - Path to input markdown file
 * @param {string} outputPath - Path to output HTML file
 * @param {object} options - Conversion options
 */
function convertMarkdownFile(inputPath, outputPath, options = {}) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const markdown = fs.readFileSync(inputPath, 'utf8');
  const mdOptions = { ...options };

  // Extract title from filename if not provided
  if (!mdOptions.title) {
    const filename = path.basename(inputPath, '.md');
    mdOptions.title = filename
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const html = markdownToHtml(markdown, mdOptions);

  fs.writeFileSync(outputPath, html, 'utf8');

  return outputPath;
}

/**
 * Convert Markdown file to HTML file (async version with pre-rendering)
 * @param {string} inputPath - Path to input markdown file
 * @param {string} outputPath - Path to output HTML file
 * @param {object} options - Conversion options
 * @returns {Promise<string>} Path to output file
 */
async function convertMarkdownFileAsync(inputPath, outputPath, options = {}) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const markdown = fs.readFileSync(inputPath, 'utf8');
  const mdOptions = { ...options };

  // Extract title from filename if not provided
  if (!mdOptions.title) {
    const filename = path.basename(inputPath, '.md');
    mdOptions.title = filename
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const html = await markdownToHtmlAsync(markdown, mdOptions);

  fs.writeFileSync(outputPath, html, 'utf8');

  return outputPath;
}

module.exports = {
  markdownToHtml,
  markdownToHtmlAsync,
  convertMarkdownFile,
  convertMarkdownFileAsync,
};
