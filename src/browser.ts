import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser } from 'puppeteer-core';

const KNOWN_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];
const PATH_NAMES = ['google-chrome', 'chromium', 'chromium-browser', 'chrome'];

export class ChromeNotFoundError extends Error {
  constructor() {
    super('Chrome/Chromium not found');
    this.name = 'ChromeNotFoundError';
  }
}

/** Locate a Chrome/Chromium executable, or return null. */
export function findChrome(
  explicit?: string,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const isFile = (p: string | undefined): p is string =>
    Boolean(p) && fs.existsSync(p as string);

  const configured = [explicit, env.PUPPETEER_EXECUTABLE_PATH, env.CHROME_PATH];
  const fromConfig = configured.find(isFile);
  if (fromConfig) return fromConfig;

  const known = KNOWN_PATHS.find(isFile);
  if (known) return known;

  for (const dir of (env.PATH ?? '').split(path.delimiter)) {
    for (const name of PATH_NAMES) {
      const candidate = path.join(dir, name);
      if (dir && isFile(candidate)) return candidate;
    }
  }
  return null;
}

export interface BrowserOptions {
  chromePath?: string;
  /** Needed in some containers and restricted user namespaces. Off by default. */
  noSandbox?: boolean;
}

/** A lazily launched browser shared by every conversion in one run. */
export interface BrowserProvider {
  get(): Promise<Browser>;
  close(): Promise<void>;
}

export function createBrowserProvider(
  options: BrowserOptions = {},
): BrowserProvider {
  let pending: Promise<Browser> | null = null;
  return {
    get() {
      pending ??= (async () => {
        const executablePath = findChrome(options.chromePath);
        if (!executablePath) throw new ChromeNotFoundError();
        return puppeteer.launch({
          executablePath,
          headless: true,
          args: options.noSandbox
            ? ['--no-sandbox', '--disable-setuid-sandbox']
            : [],
        });
      })();
      return pending;
    },
    async close() {
      if (pending) await (await pending).close();
      pending = null;
    },
  };
}
