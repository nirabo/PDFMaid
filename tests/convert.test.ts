import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createBrowserProvider } from '../src/browser.js';
import { convertFile, formatFromPath, outputPathFor } from '../src/convert.js';
import { hasChrome, makeSite } from './helpers.js';

describe('paths', () => {
  test('derives output paths', () => {
    expect(outputPathFor('/a/b.md', 'pdf')).toBe('/a/b.pdf');
    expect(outputPathFor('/a/b.md', 'md', '/o')).toBe('/o/b.prerendered.md');
    expect(formatFromPath('x.HTM')).toBe('html');
    expect(formatFromPath('x.txt')).toBeUndefined();
  });
});

describe('convertFile', () => {
  let site: ReturnType<typeof makeSite>;
  const browsers = createBrowserProvider({ noSandbox: !!process.env.CI });
  beforeEach(() => {
    site = makeSite();
  });
  afterEach(async () => {
    site.cleanup();
    await browsers.close();
  });

  const write = (name: string, text: string) => {
    const file = path.join(site.docDir, name);
    fs.writeFileSync(file, text);
    return file;
  };

  test('rejects missing and unsupported inputs', async () => {
    await expect(
      convertFile('/nope.md', { format: 'html' }, browsers),
    ).rejects.toThrow('not found');
    await expect(
      convertFile(write('a.txt', 'x'), { format: 'html' }, browsers),
    ).rejects.toThrow('Unsupported');
    await expect(
      convertFile(write('a.html', '<p>x'), { format: 'md' }, browsers),
    ).rejects.toThrow('only be converted to PDF');
  });

  test('markdown -> html inlines images and reports missing ones', async () => {
    const input = write('a.md', '# A\n\n![x](/img/a.png)\n\n![y](/img/no.png)');
    const result = await convertFile(input, { format: 'html' }, browsers);
    expect(result.output).toBe(path.join(site.docDir, 'a.html'));
    expect(fs.readFileSync(result.output, 'utf8')).toContain('data:image/png');
    expect(result.warnings).toHaveLength(1);
  });

  test.runIf(hasChrome)(
    'markdown -> pdf embeds images and renders mermaid',
    async () => {
      const input = write(
        'b.md',
        '# B\n\n![x](/img/a.png)\n\n```mermaid\ngraph TD\nA-->B\n```\n',
      );
      const out = path.join(site.root, 'out', 'b.pdf');
      const result = await convertFile(
        input,
        { format: 'pdf', output: out, theme: 'paper' },
        browsers,
      );
      expect(result.warnings).toEqual([]);
      const pdf = fs.readFileSync(out);
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(pdf.includes('/Image')).toBe(true);
    },
  );

  test.runIf(hasChrome)('html -> pdf and md -> prerendered md', async () => {
    const html = write('c.html', '<h1>Hi</h1>');
    const pdf = await convertFile(html, { format: 'pdf' }, browsers);
    expect(fs.existsSync(pdf.output)).toBe(true);

    const md = write('d.md', 'x\n\n```mermaid\ngraph TD\nA-->B\n```\n');
    const out = await convertFile(md, { format: 'md' }, browsers);
    expect(fs.readFileSync(out.output, 'utf8')).toContain('<svg');
    expect(out.warnings).toEqual([]);
  });
});
