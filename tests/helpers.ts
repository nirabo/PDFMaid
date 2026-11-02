import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findChrome } from '../src/browser.js';

// 1x1 transparent PNG
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

export const hasChrome = findChrome() !== null;

/** A throwaway site: root/static/img/a.png and root/content/docs/ */
export function makeSite() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfmaid-test-'));
  const docDir = path.join(root, 'content', 'docs');
  fs.mkdirSync(docDir, { recursive: true });
  fs.mkdirSync(path.join(root, 'static', 'img'), { recursive: true });
  fs.writeFileSync(path.join(root, 'static', 'img', 'a.png'), PNG);
  fs.writeFileSync(path.join(docDir, 'local.png'), PNG);
  return {
    root,
    docDir,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}
