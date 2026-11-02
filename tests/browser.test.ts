import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { createBrowserProvider, findChrome } from '../src/browser.js';

describe('findChrome', () => {
  test('prefers the explicit path, then env vars, then PATH', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfmaid-chrome-'));
    const file = path.join(dir, 'chromium');
    fs.writeFileSync(file, '');
    expect(findChrome(file, {})).toBe(file);
    expect(findChrome(undefined, { CHROME_PATH: file })).toBe(file);
    expect(findChrome(undefined, { PUPPETEER_EXECUTABLE_PATH: file })).toBe(
      file,
    );
    expect(findChrome('/nope', { PATH: dir })).toBeTruthy();
  });

  test('close is a no-op before the browser was used', async () => {
    await expect(createBrowserProvider().close()).resolves.toBeUndefined();
  });
});
