import fs from 'node:fs';
import path from 'node:path';
import type { BrowserProvider } from './browser.js';
import {
  markdownToHtml,
  titleFromPath,
  type RenderOptions,
} from './markdown.js';
import { prerenderMermaidDiagrams } from './mermaid.js';
import { renderPdf, type PageSize } from './pdf.js';

export type OutputFormat = 'pdf' | 'html' | 'md';

export interface ConvertOptions extends RenderOptions {
  format: OutputFormat;
  /** Output file; derived from the input when omitted. */
  output?: string;
  /** Directory for derived output files. Ignored when `output` is set. */
  outDir?: string;
  pageSize?: PageSize;
  landscape?: boolean;
  margin?: string;
}

export interface ConvertResult {
  input: string;
  output: string;
  format: OutputFormat;
  warnings: string[];
}

const EXTENSIONS = { pdf: '.pdf', html: '.html', md: '.prerendered.md' };

/** Where a conversion writes its output by default. */
export function outputPathFor(
  input: string,
  format: OutputFormat,
  outDir?: string,
): string {
  const parsed = path.parse(input);
  return path.join(outDir ?? parsed.dir, parsed.name + EXTENSIONS[format]);
}

/** Infer the output format from a file name; undefined if not recognised. */
export function formatFromPath(file: string): OutputFormat | undefined {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.md' || ext === '.markdown') return 'md';
  return undefined;
}

/** Convert one Markdown or HTML file. */
export async function convertFile(
  input: string,
  options: ConvertOptions,
  browsers: BrowserProvider,
): Promise<ConvertResult> {
  const source = path.resolve(input);
  if (!fs.existsSync(source)) throw new Error(`Input file not found: ${input}`);

  const isHtml = /\.html?$/i.test(source);
  if (!isHtml && !/\.(md|markdown)$/i.test(source)) {
    throw new Error(`Unsupported input type: ${path.extname(source) || input}`);
  }
  if (isHtml && options.format !== 'pdf') {
    throw new Error('HTML input can only be converted to PDF');
  }

  const output = path.resolve(
    options.output ?? outputPathFor(source, options.format, options.outDir),
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const warnings: string[] = [];

  if (isHtml) {
    await renderPdf(
      await browsers.get(),
      { file: source },
      { ...options, output, warnings },
    );
    return { input, output, format: 'pdf', warnings };
  }

  const markdown = fs.readFileSync(source, 'utf8');
  const theme = options.theme ?? 'default';

  if (options.format === 'md') {
    const result = await prerenderMermaidDiagrams(markdown, {
      theme,
      browser: await browsers.get(),
      warnings,
    });
    fs.writeFileSync(output, result, 'utf8');
    return { input, output, format: 'md', warnings };
  }

  const rendered = markdownToHtml(markdown, {
    ...options,
    title: options.title ?? titleFromPath(source),
    baseDir: path.dirname(source),
    interactive: options.format === 'html',
  });
  warnings.push(...rendered.warnings);

  if (options.format === 'html') {
    fs.writeFileSync(output, rendered.html, 'utf8');
  } else {
    await renderPdf(
      await browsers.get(),
      { html: rendered.html },
      { ...options, theme, output, warnings },
    );
  }
  return { input, output, format: options.format, warnings };
}
