const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { getHtmlTemplate } = require('./template');

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
    includePrintButton = true
  } = options;

  // Configure marked options
  marked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true
  });

  // Convert markdown to HTML
  let htmlContent = marked.parse(markdown);

  // Post-process: Convert mermaid code blocks to mermaid divs
  // This handles the case where marked wraps them in <pre><code class="language-mermaid">
  htmlContent = htmlContent.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    '<div class="mermaid">$1</div>'
  );

  // Wrap in full HTML template
  return getHtmlTemplate(htmlContent, {
    title,
    theme,
    includeStyles,
    includePrintButton
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

  // Extract title from filename if not provided
  if (!options.title) {
    const filename = path.basename(inputPath, '.md');
    options.title = filename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const html = markdownToHtml(markdown, options);

  fs.writeFileSync(outputPath, html, 'utf8');

  return outputPath;
}

module.exports = {
  markdownToHtml,
  convertMarkdownFile
};
