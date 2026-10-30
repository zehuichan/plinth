import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { LibConfig } from '../config.ts';
import type { Contract } from '../contract/derive.ts';
import { COMPONENTS_DIR, CORE_DIR } from '../paths.ts';
import { hyphenate } from './names.ts';

/** A CSS custom property of the token layer; `name` has the `--<prefix>-` part removed. */
export interface CssToken {
  name: string;
  value: string;
}

export interface TypographyToken {
  fontFamily?: string;
  fontSize: string;
  fontWeight?: number;
  lineHeight?: string | number;
}

export interface TokenGroups {
  colors: Record<string, string>;
  typography: Record<string, TypographyToken>;
  rounded: Record<string, string>;
  spacing: Record<string, string>;
  /** Tokens that do not follow a naming convention (or hold a value the spec cannot express). */
  other: CssToken[];
}

export interface DesignComponent {
  /** Export names that share the same source folder, e.g. `AcRadio`, `AcRadioButton`. */
  names: string[];
  /** Token names (without prefix) the component styles reference. */
  tokens: string[];
}

export interface DesignMdInput {
  name: string;
  description: string;
  cssPrefix: string;
  tokens: CssToken[];
  components: DesignComponent[];
}

const DIMENSION_RE = /^-?(?:\d+|\d*\.\d+)(?:px|em|rem)$/;
const UNITLESS_RE = /^(?:\d+|\d*\.\d+)$/;

/** Hints for the token names the template ships with. Other names simply have no hint. */
const COLOR_HINTS: Record<string, string> = {
  primary: 'brand color for primary actions, links and focus states',
  'primary-text': 'text and icons drawn on top of the primary color',
  text: 'default text color',
  bg: 'default surface and page background',
  border: 'default border and divider color',
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Reads `--<prefix>-<name>: <value>` declarations. The first declaration of a name wins, so
 * later theme overrides in the same file do not replace the default value. References to other
 * tokens (`var(--<prefix>-color-primary)`) are resolved to their value.
 */
export function parseTokens(css: string, cssPrefix: string): CssToken[] {
  const prefix = escapeRegExp(cssPrefix);
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const declared = new Map<string, string>();
  for (const match of source.matchAll(
    new RegExp(`--${prefix}-([A-Za-z0-9_-]+)\\s*:\\s*([^;{}]+)`, 'g'),
  )) {
    const name = match[1]!;
    if (!declared.has(name)) declared.set(name, match[2]!.replace(/\s*!important\s*$/, '').trim());
  }

  const reference = new RegExp(`var\\(\\s*--${prefix}-([A-Za-z0-9_-]+)\\s*(?:,[^)]*)?\\)`, 'g');
  const resolve = (value: string, depth: number): string =>
    depth > 8
      ? value
      : value.replace(reference, (whole, name: string) =>
          declared.has(name) ? resolve(declared.get(name)!, depth + 1) : whole,
        );

  return [...declared].map(([name, value]) => ({ name, value: resolve(value, 0) }));
}

function isPlainValue(value: string): boolean {
  return value !== '' && !/\b(?:var|calc|env)\(/.test(value);
}

/**
 * Sorts tokens into the design.md groups by name:
 * `color-*` colors, `radius-*` / `rounded-*` corners, `space-*` / `spacing-*` spacing and
 * `font-size-<level>` (plus the optional `font-family`, `font-weight`, `line-height`) typography.
 */
export function groupTokens(tokens: CssToken[]): TokenGroups {
  const groups: TokenGroups = { colors: {}, typography: {}, rounded: {}, spacing: {}, other: [] };
  const byName = new Map(tokens.map((token) => [token.name, token.value]));
  const consumed = new Set<string>();

  const fontSizes = tokens.filter(
    (token) => /^font-size-.+/.test(token.name) && DIMENSION_RE.test(token.value),
  );
  const family = byName.get('font-family');
  const weight = byName.get('font-weight');
  const lineHeight = byName.get('line-height');
  const lineHeightValue =
    lineHeight !== undefined && UNITLESS_RE.test(lineHeight)
      ? Number(lineHeight)
      : lineHeight !== undefined && DIMENSION_RE.test(lineHeight)
        ? lineHeight
        : undefined;
  for (const token of fontSizes) {
    const level = token.name.slice('font-size-'.length);
    groups.typography[level] = {
      ...(family !== undefined && isPlainValue(family) && { fontFamily: family }),
      fontSize: token.value,
      ...(weight !== undefined && UNITLESS_RE.test(weight) && { fontWeight: Number(weight) }),
      ...(lineHeightValue !== undefined && { lineHeight: lineHeightValue }),
    };
    consumed.add(token.name);
  }
  if (fontSizes.length)
    for (const name of ['font-family', 'font-weight', 'line-height']) consumed.add(name);

  for (const token of tokens) {
    if (consumed.has(token.name)) continue;
    const color = /^color-(.+)$/.exec(token.name);
    const radius = /^(?:radius|rounded)-(.+)$/.exec(token.name);
    const space = /^(?:space|spacing)-(.+)$/.exec(token.name);
    if (color && isPlainValue(token.value)) groups.colors[color[1]!] = token.value;
    else if (radius && DIMENSION_RE.test(token.value)) groups.rounded[radius[1]!] = token.value;
    else if (space && DIMENSION_RE.test(token.value)) groups.spacing[space[1]!] = token.value;
    else groups.other.push(token);
  }
  return groups;
}

function yamlKey(key: string): string {
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(key) ? key : JSON.stringify(key);
}

function yamlScalar(value: unknown): string {
  return typeof value === 'number' ? String(value) : JSON.stringify(String(value));
}

function emitYaml(value: Record<string, unknown>, indent = 0): string[] {
  const pad = ' '.repeat(indent);
  const lines: string[] = [];
  for (const [key, item] of Object.entries(value)) {
    if (Array.isArray(item)) {
      lines.push(`${pad}${yamlKey(key)}:`);
      for (const entry of item) {
        if (entry && typeof entry === 'object') {
          Object.entries(entry).forEach(([name, field], index) => {
            lines.push(
              `${pad}${index === 0 ? '  - ' : '    '}${yamlKey(name)}: ${yamlScalar(field)}`,
            );
          });
        } else {
          lines.push(`${pad}  - ${yamlScalar(entry)}`);
        }
      }
    } else if (item && typeof item === 'object') {
      lines.push(
        `${pad}${yamlKey(key)}:`,
        ...emitYaml(item as Record<string, unknown>, indent + 2),
      );
    } else {
      lines.push(`${pad}${yamlKey(key)}: ${yamlScalar(item)}`);
    }
  }
  return lines;
}

function isEmpty(group: object): boolean {
  return Object.keys(group).length === 0;
}

/**
 * Renders a DESIGN.md (https://github.com/google-labs-code/design.md): YAML design tokens in the
 * front matter, followed by the sections in the order the spec lists them.
 */
export function renderDesignMd(input: DesignMdInput): string {
  const { name, description, cssPrefix, components } = input;
  const groups = groupTokens(input.tokens);
  const variable = (token: string) => `--${cssPrefix}-${token}`;

  const hasTypography = !isEmpty(groups.typography);
  const hasComponents = components.some((component) => component.tokens.length > 0);
  // Sections without tokens are declared as omitted so the official linter does not warn.
  const missing: Array<[section: string, reason: string, absent: boolean]> = [
    ['colors', 'The token layer has no color tokens', isEmpty(groups.colors)],
    ['typography', 'The token layer has no font-size tokens', !hasTypography],
    ['rounded', 'The token layer has no radius tokens', isEmpty(groups.rounded)],
    ['spacing', 'The token layer has no spacing tokens', isEmpty(groups.spacing)],
    ['components', 'Component styling is described in prose, not as tokens', true],
  ];
  const omitted = missing
    .filter(([, , absent]) => absent)
    .map(([section, reason]) => ({ section, reason }));

  const frontMatter = {
    version: 'alpha',
    name,
    description,
    ...(!isEmpty(groups.colors) && { colors: groups.colors }),
    ...(hasTypography && { typography: groups.typography }),
    ...(!isEmpty(groups.rounded) && { rounded: groups.rounded }),
    ...(!isEmpty(groups.spacing) && { spacing: groups.spacing }),
    ...(omitted.length > 0 && { omitted }),
  };

  const out: string[] = [
    '---',
    ...emitYaml(frontMatter),
    '---',
    '',
    `# ${name} design language`,
    '',
  ];

  out.push(
    '## Overview',
    '',
    `${name} is a Vue 3 component library. Every visual decision is a CSS custom property with the \`--${cssPrefix}-\` prefix, defined once in \`tokens.css\`. Components read these variables and never hardcode brand values, so overriding a variable on \`:root\` (or on any ancestor element) re-themes the whole library.`,
    '',
  );

  if (!isEmpty(groups.colors)) {
    out.push('## Colors', '');
    for (const [color, value] of Object.entries(groups.colors)) {
      const hint = COLOR_HINTS[color];
      out.push(
        `- **${color} (${value}):** \`${variable(`color-${color}`)}\`${hint ? `, ${hint}` : ''}.`,
      );
    }
    out.push('');
  }

  if (hasTypography) {
    out.push('## Typography', '');
    for (const [level, token] of Object.entries(groups.typography)) {
      const extras = [
        token.fontFamily && `font ${token.fontFamily}`,
        token.fontWeight && `weight ${token.fontWeight}`,
        token.lineHeight && `line height ${token.lineHeight}`,
      ].filter(Boolean);
      out.push(
        `- **${level} (${token.fontSize}):** \`${variable(`font-size-${level}`)}\`${extras.length ? `, ${extras.join(', ')}` : ''}.`,
      );
    }
    out.push('');
  }

  if (!isEmpty(groups.spacing)) {
    out.push('## Layout', '');
    for (const [level, value] of Object.entries(groups.spacing)) {
      out.push(`- **${level} (${value}):** \`${variable(`space-${level}`)}\`.`);
    }
    out.push('');
  }

  if (!isEmpty(groups.rounded)) {
    out.push('## Shapes', '');
    for (const [level, value] of Object.entries(groups.rounded)) {
      out.push(`- **${level} (${value}):** \`${variable(`radius-${level}`)}\`.`);
    }
    out.push('');
  }

  if (hasComponents) {
    out.push(
      '## Components',
      '',
      'Which tokens each component reads. Restyle a component by overriding these variables instead of its class names.',
      '',
    );
    for (const component of components) {
      if (!component.tokens.length) continue;
      const names = component.names.map((n) => `**${n}** (\`<${hyphenate(n)}>\`)`).join(', ');
      out.push(
        `- ${names}: ${component.tokens.map((token) => `\`${variable(token)}\``).join(', ')}`,
      );
    }
    out.push('');
  }

  const doColors = !isEmpty(groups.colors)
    ? `Don't introduce colors outside the palette above; pick the closest token.`
    : `Don't introduce one-off color values; add a token first.`;
  out.push(
    "## Do's and Don'ts",
    '',
    `- Do style with \`var(${variable('…')})\` references so the UI follows the theme.`,
    `- Do re-theme by overriding variables on \`:root\` or on a wrapper element.`,
    `- ${doColors}`,
    `- Don't hardcode spacing, radius or font values that a token already covers.`,
    '',
  );

  if (groups.other.length) {
    out.push('## Other Tokens', '');
    for (const token of groups.other) out.push(`- \`${variable(token.name)}\`: \`${token.value}\``);
    out.push('');
  }

  return out.join('\n');
}

const STYLE_EXTENSIONS = new Set(['.vue', '.css', '.scss', '.less']);

function styleFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'demo') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...styleFiles(path));
    else if (STYLE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

/** Token names (without prefix) referenced by the style rules of a component folder. */
export function scanComponentTokens(dir: string, cssPrefix: string): string[] {
  const reference = new RegExp(`var\\(\\s*--${escapeRegExp(cssPrefix)}-([A-Za-z0-9_-]+)`, 'g');
  const found = new Set<string>();
  for (const file of styleFiles(dir)) {
    for (const match of readFileSync(file, 'utf8').matchAll(reference)) found.add(match[1]!);
  }
  return [...found].sort();
}

/** Builds the design.md of the library in this repository from its token layer and components. */
export function buildDesignMd(lib: LibConfig, contract: Contract): string {
  const tokensFile = join(CORE_DIR, 'styles/tokens.css');
  const manifest = JSON.parse(readFileSync(join(CORE_DIR, 'package.json'), 'utf8')) as {
    description?: string;
  };

  const bySeg = new Map<string, string[]>();
  for (const component of contract.components) {
    bySeg.set(component.seg, [...(bySeg.get(component.seg) ?? []), component.exportName]);
  }

  return renderDesignMd({
    name: lib.name,
    description: manifest.description ?? `${lib.name} component library`,
    cssPrefix: lib.cssPrefix,
    tokens: existsSync(tokensFile)
      ? parseTokens(readFileSync(tokensFile, 'utf8'), lib.cssPrefix)
      : [],
    components: [...bySeg].map(([seg, names]) => ({
      names,
      tokens: scanComponentTokens(join(COMPONENTS_DIR, seg), lib.cssPrefix),
    })),
  });
}
