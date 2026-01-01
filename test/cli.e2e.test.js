const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const cliPath = path.resolve(__dirname, '../bin/pdfmaid.js');

describe('CLI End-to-End Tests', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfmaid-e2e-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should show help message with --help', () => {
    const output = execSync(`node ${cliPath} --help`).toString();
    expect(output).toContain('USAGE:');
    expect(output).toContain('pdfmaid <input> [options]');
  });

  it('should show version number with --version', () => {
    const output = execSync(`node ${cliPath} --version`).toString();
    const { version } = require('../package.json');
    expect(output).toContain(`PDFMaid v${version}`);
  });

  it('should convert a markdown file to a PDF by default', () => {
    const inputFile = path.join(tempDir, 'test.md');
    fs.writeFileSync(inputFile, '# Hello World');
    const outputFile = path.join(tempDir, 'test.pdf');

    // This test now expects the PDF to be created successfully.
    execSync(`node ${cliPath} ${inputFile} -o ${outputFile}`);

    expect(fs.existsSync(outputFile)).toBe(true);
  });

  it('should convert a markdown file to HTML with -o html', () => {
    const inputFile = path.join(tempDir, 'test.md');
    fs.writeFileSync(inputFile, '# Hello HTML');
    const outputFile = path.join(tempDir, 'test.html');

    execSync(`node ${cliPath} ${inputFile} -o ${outputFile}`);

    expect(fs.existsSync(outputFile)).toBe(true);
    const content = fs.readFileSync(outputFile, 'utf8');
    expect(content).toContain('<h1>Hello HTML</h1>');
  });

  it('should use a custom title with --title', () => {
    const inputFile = path.join(tempDir, 'test.md');
    fs.writeFileSync(inputFile, '# Content');
    const outputFile = path.join(tempDir, 'test.html');

    execSync(
      `node ${cliPath} ${inputFile} -o ${outputFile} -t "My Custom Title"`,
    );

    const content = fs.readFileSync(outputFile, 'utf8');
    expect(content).toContain('<title>My Custom Title</title>');
  });

  it('should apply a dark theme with --theme dark', () => {
    const inputFile = path.join(tempDir, 'test.md');
    fs.writeFileSync(inputFile, '# Content');
    const outputFile = path.join(tempDir, 'test.html');

    execSync(`node ${cliPath} ${inputFile} -o ${outputFile} --theme dark`);

    const content = fs.readFileSync(outputFile, 'utf8');
    expect(content).toContain("theme: 'dark'");
  });

  it('should adjust compactness with --compact', () => {
    const inputFile = path.join(tempDir, 'test.md');
    fs.writeFileSync(inputFile, '# Content');
    const outputFile = path.join(tempDir, 'test.html');

    execSync(`node ${cliPath} ${inputFile} -o ${outputFile} --compact -4`);

    const content = fs.readFileSync(outputFile, 'utf8');
    // Check for a style that is affected by the compactness level.
    // Base is 1.6, level is -4, step is 0.06 -> 1.6 + (-4 * 0.06) = 1.36
    expect(content).toContain('line-height: 1.36');
  });

  it('should show an error for an invalid compact level', () => {
    const inputFile = path.join(tempDir, 'test.md');
    fs.writeFileSync(inputFile, '# Content');

    let errorOutput = '';
    try {
      execSync(`node ${cliPath} ${inputFile} --compact 10`);
    } catch (error) {
      errorOutput = error.stderr.toString();
    }
    expect(errorOutput).toContain('Must be an integer between -5 and 5');
  });

  it('should show an error for a non-existent input file', () => {
    let errorOutput = '';
    try {
      execSync(`node ${cliPath} nonexistent.md`);
    } catch (error) {
      errorOutput = error.stderr.toString();
    }
    expect(errorOutput).toContain('Input file not found');
  });
});
