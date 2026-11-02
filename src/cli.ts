#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseCli, UsageError, type CliOptions } from './args.js';
import { ChromeNotFoundError, createBrowserProvider } from './browser.js';
import { convertFile, type ConvertResult } from './convert.js';

const HELP = `pdfmaid - Markdown to PDF/HTML with Mermaid diagrams

Usage
  pdfmaid [options] <input...>

  Inputs are .md/.markdown files (any output) or .html files (PDF only).
  Several inputs are converted with a single shared browser.

Output
  -o, --output <file>     Output file (single input). Format follows the extension
  -d, --out-dir <dir>     Write derived outputs to <dir> (default: next to input)
  -f, --format <fmt>      pdf (default) | html | md
                          md pre-renders Mermaid blocks to inline SVG, for tools
                          such as Marp that cannot render Mermaid themselves

Document
  -t, --title <text>      Document title (default: derived from the file name)
      --theme <name>      default | dark | paper (default: default)
  -c, --compact <-5..5>   Layout density, -5 most compact, 5 most spacious
      --page-size <size>  A3 | A4 | A5 | Letter | Legal | Tabloid (default: A4)
      --landscape         Landscape orientation
      --margin <length>   Page margin, e.g. 15mm (default: the theme's @page)

Images
      --asset-root <dir>  Resolve root-absolute paths such as /img/a.png against
                          <dir> (repeatable). static/, public/ and assets/ in the
                          input's ancestor directories are found automatically
      --keep-image-links  Keep <a> links that wrap images (removed by default)
      --strict            Exit non-zero if an image or diagram cannot be rendered

Browser
      --chrome <path>     Chrome/Chromium executable (or set CHROME_PATH)
      --no-sandbox        Disable the Chrome sandbox (containers, restricted userns)

Other
  -q, --quiet             Print errors only
      --json              Print results as JSON
  -h, --help              Show this help
  -v, --version           Show the version

Examples
  pdfmaid report.md
  pdfmaid docs/*.md --out-dir pdf --theme paper
  pdfmaid page.md --asset-root site/static --strict
  pdfmaid slides.md -f md
`;

function version(): string {
  const url = new URL('../package.json', import.meta.url);
  return (JSON.parse(readFileSync(url, 'utf8')) as { version: string }).version;
}

const CHROME_HELP = `Chrome/Chromium not found. Install it, or point to it:
  pdfmaid <input> --chrome /path/to/chrome
  CHROME_PATH=/path/to/chrome pdfmaid <input>`;

async function run(options: CliOptions): Promise<number> {
  const browsers = createBrowserProvider({
    chromePath: options.chromePath,
    noSandbox: options.noSandbox,
  });
  const results: ConvertResult[] = [];
  const failures: Array<{ input: string; error: string }> = [];
  let strictViolation = false;

  try {
    for (const input of options.inputs) {
      try {
        const result = await convertFile(input, options, browsers);
        results.push(result);
        if (!options.quiet && !options.json) {
          console.log(`${input} -> ${result.output}`);
        }
        for (const warning of result.warnings) {
          if (!options.json) console.warn(`  warning: ${warning}`);
        }
        if (options.strict && result.warnings.length > 0)
          strictViolation = true;
      } catch (error) {
        if (error instanceof ChromeNotFoundError) throw error;
        failures.push({ input, error: (error as Error).message });
        if (!options.json)
          console.error(`${input}: ${(error as Error).message}`);
      }
    }
  } finally {
    await browsers.close();
  }

  if (options.json) {
    console.log(JSON.stringify({ results, failures }, null, 2));
  }
  return failures.length > 0 || strictViolation ? 1 : 0;
}

async function main(): Promise<number> {
  let options: CliOptions;
  try {
    options = parseCli(process.argv.slice(2));
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`${error.message}\nRun 'pdfmaid --help' for usage.`);
      return 2;
    }
    throw error;
  }
  if (options.help) {
    console.log(HELP);
    return 0;
  }
  if (options.version) {
    console.log(version());
    return 0;
  }
  if (options.inputs.length === 0) {
    console.error("No input files.\nRun 'pdfmaid --help' for usage.");
    return 2;
  }
  try {
    return await run(options);
  } catch (error) {
    if (error instanceof ChromeNotFoundError) {
      console.error(CHROME_HELP);
      return 1;
    }
    throw error;
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
