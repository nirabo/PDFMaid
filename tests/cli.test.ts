import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { makeSite } from './helpers.js';

const CLI = path.resolve('dist/cli.js');
const run = (...args: string[]) =>
  spawnSync('node', [CLI, ...args], { encoding: 'utf8' });

describe.runIf(fs.existsSync(CLI))('cli (built)', () => {
  let site: ReturnType<typeof makeSite>;
  beforeEach(() => {
    site = makeSite();
  });
  afterEach(() => site.cleanup());

  test('help and version', () => {
    expect(run('--help').stdout).toContain('Usage');
    expect(run('-v').stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('usage errors exit 2', () => {
    expect(run().status).toBe(2);
    expect(run('a.md', '--theme', 'x').status).toBe(2);
  });

  test('converts to html, supports --json and --strict', () => {
    const input = path.join(site.docDir, 'a.md');
    fs.writeFileSync(input, '![x](/img/a.png) ![y](/img/no.png)');
    const ok = run(input, '-f', 'html', '--json');
    expect(ok.status).toBe(0);
    expect(JSON.parse(ok.stdout).results[0].warnings).toHaveLength(1);
    expect(run(input, '-f', 'html', '--strict', '-q').status).toBe(1);
  });

  test('a failing input does not stop the others', () => {
    const good = path.join(site.docDir, 'g.md');
    fs.writeFileSync(good, '# ok');
    const r = run('/missing.md', good, '-f', 'html', '-q');
    expect(r.status).toBe(1);
    expect(fs.existsSync(path.join(site.docDir, 'g.html'))).toBe(true);
  });
});
