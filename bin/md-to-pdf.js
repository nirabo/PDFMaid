#!/usr/bin/env node

const { convertMarkdownFile, htmlToPdf, findChrome } = require('../lib');
const fs = require('fs');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
md-to-pdf - Convert Markdown directly to PDF with Mermaid diagrams

Usage:
  md-to-pdf <input.md> [output.pdf] [options]

Arguments:
  input.md       Path to input Markdown file (required)
  output.pdf     Path to output PDF file (optional, defaults to input.pdf)

Options:
  --title <text>      Set document title (default: derived from filename)
  --theme <name>      Theme: 'default' or 'dark' (default: 'default')
  --wait <ms>         Wait time for Mermaid rendering (default: 2000ms)
  --landscape         Use landscape orientation
  --keep-html         Keep intermediate HTML file
  --chrome <path>     Path to Chrome/Chromium executable
  -h, --help          Show this help message

Examples:
  md-to-pdf document.md
  md-to-pdf document.md output.pdf
  md-to-pdf document.md --title "My Document" --theme dark
  md-to-pdf document.md --keep-html --wait 3000

This is a convenience command that combines md-to-html and html-to-pdf.
For more control, use those commands separately.

Features:
  ✓ One-step Markdown → PDF conversion
  ✓ Full Mermaid.js diagram support
  ✓ GitHub Flavored Markdown (GFM)
  ✓ Professional styling and formatting
  ✓ Print-optimized output
`);
  process.exit(0);
}

const inputFile = args[0];
let outputFile = null;
let keepHtml = false;

const mdOptions = {
  title: null,
  theme: 'default',
  includeStyles: true,
  includePrintButton: false, // No need for print button in PDF
};

const pdfOptions = {
  waitTime: 2000,
  landscape: false,
  chromePath: null,
};

// Parse arguments
for (let i = 1; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--title' && args[i + 1]) {
    mdOptions.title = args[++i];
  } else if (arg === '--theme' && args[i + 1]) {
    mdOptions.theme = args[++i];
  } else if (arg === '--wait' && args[i + 1]) {
    pdfOptions.waitTime = parseInt(args[++i], 10);
  } else if (arg === '--landscape') {
    pdfOptions.landscape = true;
  } else if (arg === '--keep-html') {
    keepHtml = true;
  } else if (arg === '--chrome' && args[i + 1]) {
    pdfOptions.chromePath = args[++i];
  } else if (!arg.startsWith('--') && !outputFile) {
    outputFile = arg;
  }
}

if (!inputFile) {
  console.error('Error: Input file is required');
  console.error('Run "md-to-pdf --help" for usage information');
  process.exit(1);
}

if (!outputFile) {
  outputFile = inputFile.replace(/\.md$/i, '.pdf');
}

// Check for Chrome
if (!pdfOptions.chromePath) {
  pdfOptions.chromePath = findChrome();
}

if (!pdfOptions.chromePath) {
  console.error('❌ Error: Chrome/Chromium not found');
  console.error('');
  console.error('Please install Google Chrome or Chromium:');
  console.error('  • Ubuntu/Debian: sudo apt install chromium-browser');
  console.error('  • Fedora: sudo dnf install chromium');
  console.error('  • macOS: brew install --cask google-chrome');
  console.error('  • Or download from: https://www.google.com/chrome/');
  console.error('');
  console.error('Alternatively, set CHROME_PATH environment variable:');
  console.error('  export CHROME_PATH=/path/to/chrome');
  process.exit(1);
}

console.log('📝 Converting Markdown to PDF with Mermaid diagrams...');
console.log(`   Input:  ${inputFile}`);
console.log(`   Output: ${outputFile}`);
console.log('');

try {
  // Step 1: Convert Markdown to HTML
  const tempHtmlFile = keepHtml
    ? inputFile.replace(/\.md$/i, '.html')
    : path.join(os.tmpdir(), `md-mermaid-pdf-${Date.now()}.html`);

  console.log('📄 Step 1/2: Converting Markdown to HTML...');
  convertMarkdownFile(inputFile, tempHtmlFile, mdOptions);
  console.log('   ✓ HTML created');

  // Step 2: Convert HTML to PDF
  console.log('📄 Step 2/2: Generating PDF with rendered diagrams...');
  htmlToPdf(tempHtmlFile, outputFile, pdfOptions);
  console.log('   ✓ PDF created');

  // Clean up temporary HTML file
  if (!keepHtml) {
    fs.unlinkSync(tempHtmlFile);
  }

  console.log('');
  console.log('✅ Successfully converted to PDF');
  console.log(`   Location: ${outputFile}`);
  console.log('   📊 Mermaid diagrams have been rendered');

  if (keepHtml) {
    console.log(`   📄 HTML file saved: ${tempHtmlFile}`);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
