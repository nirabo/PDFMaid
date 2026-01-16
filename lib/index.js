const {
  markdownToHtml,
  markdownToHtmlAsync,
  convertMarkdownFile,
  convertMarkdownFileAsync,
} = require('./converter');
const { htmlToPdf, findChrome } = require('./pdf-generator');
const { getHtmlTemplate } = require('./template');
const {
  prerenderMermaidDiagrams,
  extractMermaidBlocks,
  detectDiagramType,
  isPuppeteerAvailable,
} = require('./mermaid-prerenderer');

module.exports = {
  // Converter functions
  markdownToHtml,
  markdownToHtmlAsync,
  convertMarkdownFile,
  convertMarkdownFileAsync,

  // PDF generator functions
  htmlToPdf,
  findChrome,

  // Template functions
  getHtmlTemplate,

  // Mermaid pre-rendering functions
  prerenderMermaidDiagrams,
  extractMermaidBlocks,
  detectDiagramType,
  isPuppeteerAvailable,
};
