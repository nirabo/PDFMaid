const { markdownToHtml, convertMarkdownFile } = require('./converter');
const { htmlToPdf, findChrome } = require('./pdf-generator.js');
const { getHtmlTemplate } = require('./template');

module.exports = {
  // Converter functions
  markdownToHtml,
  convertMarkdownFile,

  // PDF generator functions
  htmlToPdf,
  findChrome,

  // Template functions
  getHtmlTemplate,
};
