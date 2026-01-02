#!/usr/bin/env node

const { convertMarkdownFile } = require('../lib');

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
md-to-html - Convert Markdown to HTML with Mermaid diagram support

Usage:
  md-to-html <input.md> [output.html] [options]

Arguments:
  input.md       Path to input Markdown file (required)
  output.html    Path to output HTML file (optional, defaults to input.html)

Options:
  --title <text>      Set document title (default: derived from filename)
  --theme <name>      Theme: 'default' or 'dark' (default: 'default')
  --no-styles         Disable built-in styles
  --no-print-button   Disable print button
  -h, --help          Show this help message

Examples:
  md-to-html document.md
  md-to-html document.md output.html
  md-to-html document.md --title "My Document" --theme dark
  md-to-html document.md output.html --no-print-button

Features:
  ✓ Full Mermaid.js diagram support (flowcharts, sequence, gantt, etc.)
  ✓ GitHub Flavored Markdown (GFM)
  ✓ Syntax highlighting for code blocks
  ✓ Responsive tables and styling
  ✓ Print-optimized layout
  ✓ Dark mode support
`);
  process.exit(0);
}

const inputFile = args[0];
let outputFile = null;
const options = {
  title: null,
  theme: 'default',
  includeStyles: true,
  includePrintButton: true,
};

// Parse arguments
for (let i = 1; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === '--title' && args[i + 1]) {
    options.title = args[i + 1];
    i += 1;
  } else if (arg === '--theme' && args[i + 1]) {
    options.theme = args[i + 1];
    i += 1;
  } else if (arg === '--no-styles') {
    options.includeStyles = false;
  } else if (arg === '--no-print-button') {
    options.includePrintButton = false;
  } else if (!arg.startsWith('--') && !outputFile) {
    outputFile = arg;
  }
}

if (!inputFile) {
  console.error('Error: Input file is required');
  console.error('Run "md-to-html --help" for usage information');
  process.exit(1);
}

if (!outputFile) {
  outputFile = inputFile.replace(/\.md$/i, '.html');
}

try {
  const result = convertMarkdownFile(inputFile, outputFile, options);
  console.log('✅ Successfully converted to HTML');
  console.log(`   Input:  ${inputFile}`);
  console.log(`   Output: ${result}`);
  console.log('');
  console.log(
    '💡 Open the HTML file in your browser or use "html-to-pdf" to create a PDF',
  );
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
