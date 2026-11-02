import { pathToFileURL } from 'node:url';
import type { Browser } from 'puppeteer-core';
import { renderMermaidInPage } from './mermaid.js';

export type PageSize = 'A3' | 'A4' | 'A5' | 'Letter' | 'Legal' | 'Tabloid';

export interface PdfOptions {
  output: string;
  theme?: string;
  pageSize?: PageSize;
  landscape?: boolean;
  /** CSS length applied to all four sides, e.g. "15mm". Unset: the theme's @page. */
  margin?: string;
  warnings?: string[];
}

export type PdfSource = { html: string } | { file: string };

/**
 * Print a document to PDF. Waits for fonts, images and Mermaid, and records
 * every failed or 4xx/5xx request as a warning instead of silently dropping it.
 */
export async function renderPdf(
  browser: Browser,
  source: PdfSource,
  options: PdfOptions,
): Promise<void> {
  const {
    output,
    theme = 'default',
    pageSize = 'A4',
    landscape = false,
    margin,
    warnings = [],
  } = options;

  const page = await browser.newPage();
  try {
    page.on('requestfailed', (request) => {
      const url = request.url();
      if (!url.startsWith('data:')) {
        warnings.push(`Request failed: ${url.slice(0, 120)}`);
      }
    });
    page.on('response', (response) => {
      if (response.status() >= 400) {
        warnings.push(
          `HTTP ${response.status()}: ${response.url().slice(0, 120)}`,
        );
      }
    });

    if ('html' in source) {
      await page.setContent(source.html, { waitUntil: 'load' });
    } else {
      await page.goto(pathToFileURL(source.file).href, { waitUntil: 'load' });
    }

    const hasMermaid = await page.$('.mermaid');
    if (hasMermaid) {
      const failed = await renderMermaidInPage(page, theme);
      if (failed > 0) warnings.push(`${failed} Mermaid diagram(s) failed`);
    }

    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((img) =>
          img.complete
            ? null
            : new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              }),
        ),
      );
    });
    await page.emulateMediaType('print');
    await page.pdf({
      path: output,
      format: pageSize,
      landscape,
      printBackground: true,
      preferCSSPageSize: margin === undefined,
      ...(margin
        ? {
            margin: {
              top: margin,
              right: margin,
              bottom: margin,
              left: margin,
            },
          }
        : {}),
    });
  } finally {
    await page.close();
  }
}
