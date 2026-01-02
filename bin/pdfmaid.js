#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { convertMarkdownFile, htmlToPdf, findChrome } = require('../lib');

const VERSION = '1.0.0';

// Helper functions must be defined before they are called.
function showHelp() {
  console.log(`
🧹 PDFMaid v${VERSION}
Your Markdown to PDF/HTML converter with beautiful Mermaid diagram support

USAGE:
  pdfmaid <input> [options]

ARGUMENTS:
  <input>           Input file (.md, .markdown, .html, .htm)

OPTIONS:
  -o, --output <format|file>
                    Output format ('pdf' or 'html') or output file path
                    Default: pdf

  -f, --format <format>
                    Output format ('pdf' or 'html')

  -t, --title <text>
                    Set document title (default: derived from filename)

  --theme <name>    Theme: 'default' or 'dark' (default: 'default')

  -c, --compact <level>
                    Set compactness level from -5 (most compact) to 5 (most spacious).
                    Default: 0

  -w, --wait <ms>   Wait time for Mermaid rendering in ms (default: 2000)
                    Increase for complex diagrams

  --landscape       Use landscape orientation for PDF

  --keep-html       Keep intermediate HTML file (for md→pdf conversion)

  --no-interactive  Disable interactive features (print/copy buttons)

  --chrome <path>   Path to Chrome/Chromium executable

  -h, --help        Show this help message

  -v, --version     Show version number

EXAMPLES:
  # Convert Markdown to PDF (default)
  pdfmaid document.md

  # Convert Markdown to HTML
  pdfmaid document.md -o html

  # Specify output file
  pdfmaid document.md -o report.pdf

  # Custom title and dark theme
  pdfmaid document.md -t "API Docs" --theme dark

  # Make the layout more compact
  pdfmaid document.md --compact -3

  # Make the layout more spacious
  pdfmaid document.md --compact 3

  # Complex diagrams with extra wait time
  pdfmaid architecture.md -w 5000

  # Keep HTML for debugging
  pdfmaid document.md --keep-html

  # Convert HTML to PDF
  pdfmaid document.html -o pdf

  # Landscape PDF
  pdfmaid slides.md --landscape

SUPPORTED FEATURES:
  ✓ Full Mermaid.js diagram support (flowcharts, sequence, gantt, etc.)
  ✓ GitHub Flavored Markdown (GFM)
  ✓ Syntax-highlighted code blocks
  ✓ Dark and light themes
  ✓ Professional typography
  ✓ Print-optimized PDF output
  ✓ Interactive HTML features

REQUIREMENTS:
  • Node.js >= 14.0.0
  • Google Chrome or Chromium (for PDF generation)

For more information, visit: https://github.com/nirabo/pdfmaid
`);
}

function showChromeError() {
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
  console.error('');
  console.error('Or use --chrome flag:');
  console.error('  pdfmaid document.md --chrome /path/to/chrome');
}

// Parse arguments
const args = process.argv.slice(2);

// Show help
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Show version
if (args.includes('--version') || args.includes('-v')) {
  console.log(`PDFMaid v${VERSION}`);
  process.exit(0);
}

// Parse input file (first non-flag argument)
let inputFile = null;
let outputFile = null;
let outputFormat = 'pdf'; // default
let keepHtml = false;
let formatExplicitlySet = false;

const mdOptions = {
  title: null,
  theme: 'default',
  includeStyles: true,
  includePrintButton: true,
  compactLevel: 0,
};

const pdfOptions = {
  waitTime: 2000,
  landscape: false,
  chromePath: null,
};

// Parse all arguments
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === '--output' || arg === '-o') {
    const nextArg = args[i + 1];
    if (nextArg === 'pdf' || nextArg === 'html') {
      outputFormat = nextArg;
      formatExplicitlySet = true;
      i += 1;
    } else if (
      nextArg &&
      !nextArg.startsWith('--') &&
      !nextArg.startsWith('-')
    ) {
      // It's a file path
      outputFile = nextArg;
      i += 1;
    }
  } else if (arg === '--format' || arg === '-f') {
    const format = args[i + 1];
    if (format === 'pdf' || format === 'html') {
      outputFormat = format;
      formatExplicitlySet = true;
      i += 1;
    } else {
      console.error(`Error: Invalid format '${format}'. Use 'pdf' or 'html'.`);
      process.exit(1);
    }
  } else if (arg === '--title' || arg === '-t') {
    mdOptions.title = args[i + 1];
    i += 1;
  } else if (arg === '--theme') {
    mdOptions.theme = args[i + 1];
    i += 1;
  } else if (arg === '--compact' || arg === '-c') {
    const level = parseInt(args[i + 1], 10);
    if (Number.isNaN(level) || level < -5 || level > 5) {
      console.error(
        `Error: Invalid compact level '${
          args[i + 1]
        }'. Must be an integer between -5 and 5.`,
      );
      process.exit(1);
    }
    mdOptions.compactLevel = level;
    i += 1;
  } else if (arg === '--wait' || arg === '-w') {
    pdfOptions.waitTime = parseInt(args[i + 1], 10);
    i += 1;
  } else if (arg === '--landscape') {
    pdfOptions.landscape = true;
  } else if (arg === '--keep-html') {
    keepHtml = true;
  } else if (arg === '--no-interactive') {
    mdOptions.includePrintButton = false;
  } else if (arg === '--chrome') {
    pdfOptions.chromePath = args[i + 1];
    i += 1;
  } else if (!arg.startsWith('--') && !arg.startsWith('-')) {
    if (!inputFile) {
      inputFile = arg;
    } else if (!outputFile) {
      outputFile = arg;
    }
  }
}

// Validate input file
if (!inputFile) {
  console.error('Error: Input file is required');
  console.error('Run "pdfmaid --help" for usage information');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file not found: ${inputFile}`);
  process.exit(1);
}

// Determine input type
const inputExt = path.extname(inputFile).toLowerCase();
const isMarkdown = ['.md', '.markdown'].includes(inputExt);
const isHtml = ['.html', '.htm'].includes(inputExt);

if (!isMarkdown && !isHtml) {
  console.error(`Error: Unsupported file type: ${inputExt}`);
  console.error('Supported types: .md, .markdown, .html, .htm');
  process.exit(1);
}

// Determine output file if not specified
if (!outputFile) {
  const baseName = path.basename(inputFile, path.extname(inputFile));
  outputFile = path.join(
    path.dirname(inputFile),
    `${baseName}.${outputFormat}`,
  );
}

// Infer output format from output file extension if not explicitly set
const outputExt = path.extname(outputFile).toLowerCase();
if (!formatExplicitlySet) {
  if (['.html', '.htm'].includes(outputExt)) {
    outputFormat = 'html';
  } else if (['.pdf'].includes(outputExt)) {
    outputFormat = 'pdf';
  }
}

// Ensure output has correct extension
if (outputFormat === 'pdf' && !['.pdf'].includes(outputExt)) {
  outputFile += '.pdf';
} else if (outputFormat === 'html' && !['.html', '.htm'].includes(outputExt)) {
  outputFile += '.html';
}

// Main conversion logic
try {
  console.log('🧹 PDFMaid - Converting your documents...');
  console.log(`   Input:  ${inputFile} (${isMarkdown ? 'Markdown' : 'HTML'})`);
  console.log(`   Output: ${outputFile} (${outputFormat.toUpperCase()})`);
  console.log('');

  if (isMarkdown && outputFormat === 'html') {
    // Markdown → HTML
    console.log('📄 Converting Markdown to HTML...');
    convertMarkdownFile(inputFile, outputFile, mdOptions);
    console.log('   ✓ HTML created');
    console.log('');
    console.log('✅ Conversion complete!');
    console.log(`   Location: ${outputFile}`);
  } else if (isMarkdown && outputFormat === 'pdf') {
    // Markdown → PDF (two-step)
    mdOptions.includePrintButton = false; // No print button in PDF

    // Check for Chrome first
    if (!pdfOptions.chromePath) {
      pdfOptions.chromePath = findChrome();
    }
    if (!pdfOptions.chromePath) {
      showChromeError();
      process.exit(1);
    }

    const tempHtmlFile = keepHtml
      ? inputFile.replace(/\.(md|markdown)$/i, '.html')
      : path.join(os.tmpdir(), `pdfmaid-${Date.now()}.html`);

    console.log('📄 Step 1/2: Converting Markdown to HTML...');
    convertMarkdownFile(inputFile, tempHtmlFile, mdOptions);
    console.log('   ✓ HTML created');

    console.log('📄 Step 2/2: Generating PDF with rendered diagrams...');
    htmlToPdf(tempHtmlFile, outputFile, pdfOptions);
    console.log('   ✓ PDF created');

    // Clean up temp HTML
    if (!keepHtml && fs.existsSync(tempHtmlFile)) {
      fs.unlinkSync(tempHtmlFile);
    }

    console.log('');
    console.log('✅ Conversion complete!');
    console.log(`   Location: ${outputFile}`);
    console.log('   📊 Mermaid diagrams have been rendered');
    if (keepHtml) {
      console.log(`   📄 HTML file saved: ${tempHtmlFile}`);
    }
  } else if (isHtml && outputFormat === 'pdf') {
    // HTML → PDF
    if (!pdfOptions.chromePath) {
      pdfOptions.chromePath = findChrome();
    }
    if (!pdfOptions.chromePath) {
      showChromeError();
      process.exit(1);
    }

    console.log('📄 Converting HTML to PDF...');
    htmlToPdf(inputFile, outputFile, pdfOptions);
    console.log('   ✓ PDF created');
    console.log('');
    console.log('✅ Conversion complete!');
    console.log(`   Location: ${outputFile}`);
    console.log('   📊 Mermaid diagrams have been rendered');
  } else if (isHtml && outputFormat === 'html') {
    console.error('Error: Cannot convert HTML to HTML. Input is already HTML.');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
