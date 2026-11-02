import { parseArgs } from 'node:util';
import { formatFromPath, type OutputFormat } from './convert.js';
import type { PageSize } from './pdf.js';
import type { Theme } from './theme/template.js';

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

export interface CliOptions {
  inputs: string[];
  format: OutputFormat;
  output?: string;
  outDir?: string;
  title?: string;
  theme: Theme;
  compactLevel: number;
  assetRoots: string[];
  unwrapImageLinks: boolean;
  strict: boolean;
  pageSize: PageSize;
  landscape: boolean;
  margin?: string;
  chromePath?: string;
  noSandbox: boolean;
  quiet: boolean;
  json: boolean;
  help: boolean;
  version: boolean;
}

const THEMES = ['default', 'dark', 'paper'];
const FORMATS = ['pdf', 'html', 'md'];
const PAGE_SIZES = ['A3', 'A4', 'A5', 'Letter', 'Legal', 'Tabloid'];

function oneOf<T extends string>(
  name: string,
  value: string,
  allowed: readonly string[],
): T {
  if (!allowed.includes(value)) {
    throw new UsageError(
      `Invalid ${name} '${value}'. Use one of: ${allowed.join(', ')}.`,
    );
  }
  return value as T;
}

/** `-c -3` is ambiguous for parseArgs; rewrite it to `--compact=-3`. */
function joinNegativeCompact(argv: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] as string;
    const next = argv[i + 1];
    if ((arg === '-c' || arg === '--compact') && next && /^-\d+$/.test(next)) {
      out.push(`--compact=${next}`);
      i += 1;
    } else {
      out.push(arg);
    }
  }
  return out;
}

/** Parse command-line arguments. Throws UsageError on invalid input. */
export function parseCli(argv: string[]): CliOptions {
  let parsed;
  try {
    parsed = parseArgs({
      args: joinNegativeCompact(argv),
      allowPositionals: true,
      options: {
        output: { type: 'string', short: 'o' },
        'out-dir': { type: 'string', short: 'd' },
        format: { type: 'string', short: 'f' },
        title: { type: 'string', short: 't' },
        theme: { type: 'string', default: 'default' },
        compact: { type: 'string', short: 'c', default: '0' },
        'asset-root': { type: 'string', multiple: true, default: [] },
        'keep-image-links': { type: 'boolean', default: false },
        strict: { type: 'boolean', default: false },
        'page-size': { type: 'string', default: 'A4' },
        landscape: { type: 'boolean', default: false },
        margin: { type: 'string' },
        chrome: { type: 'string' },
        'no-sandbox': { type: 'boolean', default: false },
        quiet: { type: 'boolean', short: 'q', default: false },
        json: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
    });
  } catch (error) {
    throw new UsageError((error as Error).message);
  }
  const { values, positionals } = parsed;

  const compactLevel = Number(values.compact);
  if (
    !Number.isInteger(compactLevel) ||
    compactLevel < -5 ||
    compactLevel > 5
  ) {
    throw new UsageError(
      `Invalid compact level '${values.compact}'. Must be an integer from -5 to 5.`,
    );
  }
  if (values.output && positionals.length > 1) {
    throw new UsageError('--output needs exactly one input; use --out-dir.');
  }
  if (values.output && values['out-dir']) {
    throw new UsageError('Use either --output or --out-dir, not both.');
  }

  const explicit = values.format
    ? oneOf<OutputFormat>('format', values.format, FORMATS)
    : undefined;
  const format =
    explicit ??
    (values.output ? formatFromPath(values.output) : undefined) ??
    'pdf';

  return {
    inputs: positionals,
    format,
    output: values.output,
    outDir: values['out-dir'],
    title: values.title,
    theme: oneOf<Theme>('theme', values.theme ?? 'default', THEMES),
    compactLevel,
    assetRoots: values['asset-root'] ?? [],
    unwrapImageLinks: !values['keep-image-links'],
    strict: values.strict ?? false,
    pageSize: oneOf<PageSize>(
      'page size',
      values['page-size'] ?? 'A4',
      PAGE_SIZES,
    ),
    landscape: values.landscape ?? false,
    margin: values.margin,
    chromePath: values.chrome,
    noSandbox: values['no-sandbox'] ?? false,
    quiet: values.quiet ?? false,
    json: values.json ?? false,
    help: values.help ?? false,
    version: values.version ?? false,
  };
}
