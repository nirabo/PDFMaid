import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { discoverAssetRoots, inlineImages } from '../src/assets.js';
import { makeSite } from './helpers.js';

describe('assets', () => {
  let site: ReturnType<typeof makeSite>;
  beforeEach(() => {
    site = makeSite();
  });
  afterEach(() => site.cleanup());

  test('discovers static dirs in ancestors', () => {
    expect(discoverAssetRoots(site.docDir)).toContain(
      path.join(site.root, 'static'),
    );
  });

  test('inlines root-absolute images from an auto-detected static dir', () => {
    const warnings: string[] = [];
    const out = inlineImages('<img src="/img/a.png" alt="x">', {
      baseDir: site.docDir,
      warnings,
    });
    expect(out).toMatch(/src="data:image\/png;base64,/);
    expect(warnings).toEqual([]);
  });

  test('honours explicit asset roots', () => {
    const out = inlineImages('<img src="/a.png">', {
      baseDir: site.docDir,
      assetRoots: [path.join(site.root, 'static', 'img')],
    });
    expect(out).toMatch(/data:image\/png/);
  });

  test('inlines relative images against the document directory', () => {
    const out = inlineImages('<img src="local.png?v=1">', {
      baseDir: site.docDir,
    });
    expect(out).toMatch(/src="data:image\/png;base64,/);
  });

  test('leaves remote and data URIs alone', () => {
    const html =
      '<img src="https://x.test/a.png"><img src="data:image/png;base64,AA">';
    expect(inlineImages(html, { baseDir: site.docDir })).toBe(html);
  });

  test('warns about missing images and keeps the tag', () => {
    const warnings: string[] = [];
    const html = '<img src="/img/missing.png"><img src="local.png">';
    const out = inlineImages(html, { baseDir: site.docDir, warnings });
    expect(out).toContain('src="/img/missing.png"');
    expect(warnings).toHaveLength(1);
  });

  test('unwraps links around images when asked', () => {
    const out = inlineImages(
      '<a href="/img/a-4k.png"><img src="local.png"></a>',
      { baseDir: site.docDir, unwrapLinks: true },
    );
    expect(out).not.toContain('<a ');
  });
});
