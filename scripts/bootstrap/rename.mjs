import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { unscopedName } from './options.mjs';

const SKIP_DIR = new Set(['.git', 'node_modules', 'dist', 'es', '.turbo', '.cache', 'bootstrap']);

export function buildReplacements(opts) {
  const unscoped = unscopedName(opts.name);
  return [
    ['PlinthResolver', `${opts.installer}Resolver`],
    ['@plinth/ui', opts.name],
    ['Plinth', opts.installer],
    ['plinth', unscoped],
  ];
}

// Matches the css sentinel wherever it starts a word: `--pl-color-x`, `.pl-button`,
// `pl-button__icon`, and docs globs like `--pl-*`.
export const CSS_SENTINEL_RE = /\bpl-(?=[a-z*])/g;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

export function renameTokens(root, opts) {
  const replacements = buildReplacements(opts);
  const prefixRe = new RegExp(`\\bPl(?=[A-Z])`, 'g');
  const files = walk(root).filter((f) => {
    const rel = relative(root, f).replaceAll('\\', '/');
    if (rel.startsWith('scripts/bootstrap/')) return false;
    const base = basename(f);
    return (
      /\.(ts|tsx|mts|vue|md|json|mjs|css|html|yml|yaml|hbs)$/.test(f) ||
      ['LICENSE', 'AGENTS.md', 'README.md', 'CHANGELOG.md'].includes(base)
    );
  });

  for (const file of files) {
    let text = readFileSync(file, 'utf8');
    const original = text;
    for (const [from, to] of replacements) {
      text = text.split(from).join(to);
    }
    text = text.replace(CSS_SENTINEL_RE, `${opts.cssPrefix}-`);
    text = text.replace(prefixRe, opts.prefix);
    if (text !== original) writeFileSync(file, text);
  }
}
