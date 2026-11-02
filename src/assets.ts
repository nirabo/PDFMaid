import fs from 'node:fs';
import path from 'node:path';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

const REMOTE_SRC = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const STATIC_DIR_NAMES = ['static', 'public', 'assets'];

/**
 * Find conventional static-asset directories (Docusaurus `static/`,
 * Vite `public/`, ...) in baseDir and each of its ancestors.
 * @param {string} baseDir - Directory of the source document
 * @returns {string[]} Existing asset root directories, nearest first
 */
export function discoverAssetRoots(baseDir: string): string[] {
  const roots: string[] = [];
  let dir = path.resolve(baseDir);
  for (;;) {
    const here = dir;
    STATIC_DIR_NAMES.forEach((name) => {
      const candidate = path.join(here, name);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        roots.push(candidate);
      }
    });
    const parent = path.dirname(dir);
    if (parent === dir) return roots;
    dir = parent;
  }
}

/**
 * Resolve an image reference to a file on disk.
 * Relative paths are tried against baseDir first, then the asset roots.
 * Root-absolute paths ("/img/a.png") are tried against the asset roots only.
 * @returns {string|null} Absolute path of an existing file, or null
 */
export function resolveAsset(
  src: string,
  { baseDir, assetRoots }: { baseDir: string; assetRoots: string[] },
): string | null {
  let clean = src.split(/[?#]/)[0] ?? src;
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // keep the raw path
  }
  const candidates = clean.startsWith('/')
    ? assetRoots.map((root) => path.join(root, clean))
    : [
        path.resolve(baseDir, clean),
        ...assetRoots.map((r) => path.join(r, clean)),
      ];
  return (
    candidates.find(
      (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
    ) || null
  );
}

export interface InlineImagesOptions {
  /** Directory of the source document. */
  baseDir: string;
  /** Extra roots for root-absolute ("/img/a.png") paths. */
  assetRoots?: string[];
  /** Drop <a> wrappers around images. */
  unwrapLinks?: boolean;
  /** Receives one message per missing image. */
  warnings?: string[];
}

/**
 * Inline every local <img> as a data: URI so the HTML is self-contained and
 * independent of where it is written or which directory Chrome opens it from.
 */
export function inlineImages(
  html: string,
  options: InlineImagesOptions,
): string {
  const { baseDir, unwrapLinks = false, warnings = [] } = options;
  const assetRoots = [
    ...(options.assetRoots || []).map((r) => path.resolve(r)),
    ...discoverAssetRoots(baseDir),
  ];
  const cache = new Map<string, string | null>();

  let out = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const match = tag.match(/\bsrc="([^"]*)"/i);
    if (!match || REMOTE_SRC.test(match[1] ?? '')) return tag;
    const src = (match[1] ?? '').replace(/&amp;/g, '&');

    if (!cache.has(src)) {
      const file = resolveAsset(src, { baseDir, assetRoots });
      const mime = file
        ? MIME_TYPES[path.extname(file).toLowerCase()]
        : undefined;
      if (file && mime) {
        const data = fs.readFileSync(file).toString('base64');
        cache.set(src, `data:${mime};base64,${data}`);
      } else {
        warnings.push(`Image not found or unsupported: ${src}`);
        cache.set(src, null);
      }
    }
    const uri = cache.get(src);
    return uri ? tag.replace(match[0], `src="${uri}"`) : tag;
  });

  if (unwrapLinks) {
    out = out.replace(/<a\b[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi, '$1');
  }
  return out;
}
