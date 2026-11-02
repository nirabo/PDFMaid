import { describe, expect, test } from 'vitest';
import { parseCli, UsageError } from '../src/args.js';

describe('parseCli', () => {
  test('defaults', () => {
    expect(parseCli(['a.md'])).toMatchObject({
      inputs: ['a.md'],
      format: 'pdf',
      theme: 'default',
      compactLevel: 0,
      pageSize: 'A4',
      unwrapImageLinks: true,
      noSandbox: false,
    });
  });

  test('infers the format from the output extension', () => {
    expect(parseCli(['a.md', '-o', 'out.html']).format).toBe('html');
    expect(parseCli(['a.md', '-o', 'out.pdf']).format).toBe('pdf');
    expect(parseCli(['a.md', '-o', 'out.md']).format).toBe('md');
  });

  test('explicit --format wins', () => {
    expect(parseCli(['a.md', '-f', 'html']).format).toBe('html');
  });

  test('accepts a negative compact level in both spellings', () => {
    expect(parseCli(['a.md', '-c', '-3']).compactLevel).toBe(-3);
    expect(parseCli(['a.md', '--compact=-2']).compactLevel).toBe(-2);
  });

  test('collects repeated --asset-root', () => {
    const o = parseCli(['a.md', '--asset-root', 'x', '--asset-root', 'y']);
    expect(o.assetRoots).toEqual(['x', 'y']);
  });

  test.each([
    [['a.md', '--theme', 'neon']],
    [['a.md', '-f', 'docx']],
    [['a.md', '-c', '9']],
    [['a.md', '--page-size', 'B7']],
    [['a.md', '--nope']],
    [['a.md', 'b.md', '-o', 'x.pdf']],
    [['a.md', '-o', 'x.pdf', '-d', 'out']],
  ])('rejects %j', (argv) => {
    expect(() => parseCli(argv)).toThrow(UsageError);
  });
});
