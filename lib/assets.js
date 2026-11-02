const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
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
function discoverAssetRoots(baseDir) {
  const roots = [];
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
function resolveAsset(src, { baseDir, assetRoots }) {
  let clean = src.split(/[?#]/)[0];
  try {
    clean = decodeURIComponent(clean);
  } catch (error) {
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

/**
 * Inline every local <img> as a data: URI so the HTML is self-contained and
 * independent of where it is written or which directory Chrome opens it from.
 * @param {string} html - Rendered HTML
 * @param {object} options
 * @param {string} options.baseDir - Directory of the source document
 * @param {string[]} [options.assetRoots] - Extra roots for "/..." paths
 * @param {boolean} [options.unwrapLinks] - Drop <a> wrappers around images
 * @param {string[]} [options.warnings] - Receives one message per missing image
 * @returns {string} HTML with inlined images
 */
function inlineImages(html, options) {
  const { baseDir, unwrapLinks = false, warnings = [] } = options;
  const assetRoots = [
    ...(options.assetRoots || []).map((r) => path.resolve(r)),
    ...discoverAssetRoots(baseDir),
  ];
  const cache = new Map();

  let out = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const match = tag.match(/\bsrc="([^"]*)"/i);
    if (!match || REMOTE_SRC.test(match[1])) return tag;
    const src = match[1].replace(/&amp;/g, '&');

    if (!cache.has(src)) {
      const file = resolveAsset(src, { baseDir, assetRoots });
      const mime = file && MIME_TYPES[path.extname(file).toLowerCase()];
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

module.exports = { inlineImages, resolveAsset, discoverAssetRoots };
