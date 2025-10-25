#!/usr/bin/env node

const { htmlToPdf, findChrome } = require('../lib');
const path = require('path');

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
html-to-pdf - Convert HTML to PDF with rendered Mermaid diagrams

Usage:
  html-to-pdf <input.html> [output.pdf] [options]

Arguments:
  input.html     Path to input HTML file (required)
  output.pdf     Path to output PDF file (optional, defaults to input.pdf)

Options:
  --wait <ms>         Wait time for Mermaid rendering (default: 2000ms)
  --landscape         Use landscape orientation
  --chrome <path>     Path to Chrome/Chromium executable
  -h, --help          Show this help message

Examples:
  html-to-pdf document.html
  html-to-pdf document.html output.pdf
  html-to-pdf document.html --wait 3000
  html-to-pdf document.html --landscape
  html-to-pdf document.html --chrome /path/to/chrome

Requirements:
  - Google Chrome or Chromium must be installed
  - Set CHROME_PATH environment variable if Chrome is not in standard location

Features:
  ✓ Renders Mermaid diagrams before PDF generation
  ✓ A4 page format optimized for printing
  ✓ Proper page breaks for headings and content
  ✓ No header/footer clutter
`);
  process.exit(0);
}

const inputFile = args[0];
let outputFile = null;
const options = {
  waitTime: 2000,
  landscape: false,
  chromePath: null
};

// Parse arguments
for (let i = 1; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--wait' && args[i + 1]) {
    options.waitTime = parseInt(args[++i], 10);
  } else if (arg === '--landscape') {
    options.landscape = true;
  } else if (arg === '--chrome' && args[i + 1]) {
    options.chromePath = args[++i];
  } else if (!arg.startsWith('--') && !outputFile) {
    outputFile = arg;
  }
}

if (!inputFile) {
  console.error('Error: Input file is required');
  console.error('Run "html-to-pdf --help" for usage information');
  process.exit(1);
}

if (!outputFile) {
  outputFile = inputFile.replace(/\.html$/i, '.pdf');
}

// Check for Chrome
if (!options.chromePath) {
  options.chromePath = findChrome();
}

if (!options.chromePath) {
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

console.log('📄 Converting HTML to PDF with rendered Mermaid diagrams...');
console.log(`   Input:  ${inputFile}`);
console.log(`   Output: ${outputFile}`);
console.log(`   Chrome: ${options.chromePath}`);
console.log('');

try {
  const result = htmlToPdf(inputFile, outputFile, options);
  console.log('✅ PDF successfully created');
  console.log(`   Location: ${result}`);
  console.log('   📊 Mermaid diagrams have been rendered in the PDF');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('');
  console.error('Alternative: Open the HTML file in your browser and use Print → Save as PDF');
  process.exit(1);
}
