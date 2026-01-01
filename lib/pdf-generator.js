const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pdfGenerator = {};

/**
 * Find Chrome executable on the system
 * @returns {string|null} Path to Chrome executable or null if not found
 */
function findChrome() {
  const possiblePaths = [
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH,
  ].filter(Boolean);

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }

  // Try to find in PATH
  try {
    const which = process.platform === 'win32' ? 'where' : 'which';
    const result = execSync(
      `${which} google-chrome chromium chromium-browser 2>/dev/null || true`,
      {
        encoding: 'utf8',
      },
    ).trim();

    if (result) {
      return result.split('\n')[0];
    }
  } catch (error) {
    // Ignore
  }

  return null;
}

/**
 * Convert HTML file to PDF using Chrome headless
 * @param {string} inputPath - Path to input HTML file
 * @param {string} outputPath - Path to output PDF file
 * @param {object} options - PDF generation options
 */
function htmlToPdf(inputPath, outputPath, options = {}) {
  const {
    chromePath = pdfGenerator.findChrome(), // Use the exported object to allow mocking
    waitTime = 2000, // Wait for Mermaid to render
    landscape = false,
    marginTop = 0,
    marginBottom = 0,
    marginLeft = 0,
    marginRight = 0,
  } = options;

  const absoluteInputPath = path.resolve(inputPath);

  if (!fs.existsSync(absoluteInputPath)) {
    throw new Error(`Input file not found: ${absoluteInputPath}`);
  }

  if (!chromePath) {
    throw new Error(
      'Chrome/Chromium not found. Please install Chrome or set the chromePath option.',
    );
  }

  const absoluteOutputPath = path.resolve(outputPath);

  // Build Chrome command
  const args = [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--print-to-pdf="${absoluteOutputPath}"`,
    '--no-pdf-header-footer',
  ];

  if (landscape) {
    args.push('--landscape');
  }

  // Add margin options if specified
  if (marginTop || marginBottom || marginLeft || marginRight) {
    args.push(`--print-to-pdf-no-header`);
  }

  // Add the file URL
  args.push(`"file://${absoluteInputPath}"`);

  // We add a virtual time budget to allow JS-rendered content like Mermaid diagrams to finish
  const command = `"${chromePath}" --virtual-time-budget=${waitTime} ${args.join(
    ' ',
  )}`;

  try {
    execSync(command, { stdio: 'pipe', timeout: 30000 });

    if (!fs.existsSync(absoluteOutputPath)) {
      throw new Error('PDF was not created');
    }

    return absoluteOutputPath;
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

pdfGenerator.findChrome = findChrome;
pdfGenerator.htmlToPdf = htmlToPdf;

module.exports = pdfGenerator;
