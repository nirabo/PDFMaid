const fs = require('fs');
const os = require('os');
const path = require('path');
const { inlineImages, discoverAssetRoots } = require('../lib/assets');

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

describe('assets', () => {
  let root;
  let docDir;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfmaid-assets-'));
    docDir = path.join(root, 'content', 'docs');
    fs.mkdirSync(docDir, { recursive: true });
    fs.mkdirSync(path.join(root, 'static', 'img'), { recursive: true });
    fs.writeFileSync(path.join(root, 'static', 'img', 'a.png'), PNG);
    fs.writeFileSync(path.join(docDir, 'local.png'), PNG);
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  test('discovers static dirs in ancestors', () => {
    expect(discoverAssetRoots(docDir)).toContain(path.join(root, 'static'));
  });

  test('inlines root-absolute images from an auto-detected static dir', () => {
    const warnings = [];
    const out = inlineImages('<img src="/img/a.png" alt="x">', {
      baseDir: docDir,
      warnings,
    });
    expect(out).toMatch(/src="data:image\/png;base64,/);
    expect(warnings).toEqual([]);
  });

  test('inlines relative images against the document directory', () => {
    const out = inlineImages('<img src="local.png">', { baseDir: docDir });
    expect(out).toMatch(/src="data:image\/png;base64,/);
  });

  test('leaves remote and data URIs alone', () => {
    const html =
      '<img src="https://x.test/a.png"><img src="data:image/png;base64,AA">';
    expect(inlineImages(html, { baseDir: docDir })).toBe(html);
  });

  test('warns about missing images and keeps the tag', () => {
    const warnings = [];
    const html = '<img src="/img/missing.png">';
    expect(inlineImages(html, { baseDir: docDir, warnings })).toBe(html);
    expect(warnings).toHaveLength(1);
  });

  test('unwraps links around images when asked', () => {
    const out = inlineImages(
      '<a href="/img/a-4k.png"><img src="local.png"></a>',
      {
        baseDir: docDir,
        unwrapLinks: true,
      },
    );
    expect(out).not.toContain('<a ');
  });
});
