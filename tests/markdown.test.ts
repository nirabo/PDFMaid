import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { markdownToHtml, titleFromPath } from '../src/markdown.js';
import { makeSite } from './helpers.js';

describe('markdownToHtml', () => {
  test('renders GFM into a full document', () => {
    const { html } = markdownToHtml('# Hi\n\n| a | b |\n|---|---|\n| 1 | 2 |', {
      title: 'T <1>',
    });
    expect(html).toContain('<title>T &lt;1&gt;</title>');
    expect(html).toContain('<table>');
  });

  test('turns mermaid fences into <pre class="mermaid">', () => {
    const { html } = markdownToHtml('```mermaid\ngraph TD\nA-->B\n```');
    expect(html).toContain('<pre class="mermaid">graph TD\nA--&gt;B</pre>');
  });

  test('keeps ordinary code fences', () => {
    expect(markdownToHtml('```js\nlet a;\n```').html).toContain(
      'class="language-js"',
    );
  });

  test('interactive=false drops the print button and CDN script', () => {
    const { html } = markdownToHtml('x', { interactive: false });
    expect(html).not.toContain('<button');
    expect(html).not.toContain('cdn.jsdelivr.net');
  });

  test('applies each theme', () => {
    for (const theme of ['default', 'dark', 'paper'] as const) {
      expect(markdownToHtml('# T', { theme, compactLevel: -2 }).html).toContain(
        '<style',
      );
    }
  });

  test('wraps paper-theme front matter', () => {
    const { html } = markdownToHtml(
      '# T\n\n**Owner:** me\n**Date:** now\n\n## S',
      { theme: 'paper' },
    );
    expect(html).toContain('<dl class="meta">');
  });

  describe('images', () => {
    let site: ReturnType<typeof makeSite>;
    beforeEach(() => {
      site = makeSite();
    });
    afterEach(() => site.cleanup());

    test('inlines images and reports missing ones', () => {
      const r = markdownToHtml('![a](/img/a.png)\n\n![b](/img/none.png)', {
        baseDir: site.docDir,
      });
      expect(r.html).toContain('data:image/png;base64,');
      expect(r.warnings).toHaveLength(1);
    });

    test('unwraps linked images by default and can keep them', () => {
      const md = '[![a](/img/a.png)](/img/a-4k.png)';
      expect(markdownToHtml(md, { baseDir: site.docDir }).html).not.toContain(
        'a-4k.png',
      );
      expect(
        markdownToHtml(md, { baseDir: site.docDir, unwrapImageLinks: false })
          .html,
      ).toContain('a-4k.png');
    });
  });
});

describe('titleFromPath', () => {
  test('derives a title from the file name', () => {
    expect(titleFromPath('/x/my-doc_name.md')).toBe('My Doc Name');
  });
});
