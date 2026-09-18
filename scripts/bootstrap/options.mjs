import { parseArgs } from 'node:util';
import * as clack from '@clack/prompts';
import validate from 'validate-npm-package-name';
import { PREPROCESSOR_CHOICES } from './preprocessor.mjs';

export const UI_CHOICES = ['none', 'antdv', 'antdv-next', 'element-plus', 'tdesign'];
export const CI_CHOICES = ['github', 'gitlab', 'none'];

function fail(message) {
  throw new Error(message);
}

export function pascalFromName(name) {
  const base = name.includes('/') ? name.split('/')[1] : name;
  return base
    .split(/[-_]/g)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('');
}

export function parseFlags(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      yes: { type: 'boolean', default: false },
      name: { type: 'string' },
      prefix: { type: 'string' },
      'css-prefix': { type: 'string' },
      installer: { type: 'string' },
      registry: { type: 'string' },
      ui: { type: 'string' },
      preprocessor: { type: 'string' },
      ci: { type: 'string' },
      'no-playground': { type: 'boolean', default: false },
      license: { type: 'string' },
    },
    allowPositionals: false,
  });
  return values;
}

export function validateOptions(opts) {
  opts = { ...opts, preprocessor: opts.preprocessor || 'none' };
  if (!opts.name) fail('--name is required');
  const result = validate(opts.name);
  if (!result.validForNewPackages) {
    fail(`invalid package name: ${opts.name}`);
  }
  if (!opts.prefix || !/^[A-Z][A-Za-z0-9]+$/.test(opts.prefix) || opts.prefix.length < 2) {
    fail('--prefix must be PascalCase and at least 2 characters');
  }
  if (!opts.registry) fail('--registry is required');
  if (!UI_CHOICES.includes(opts.ui)) fail(`--ui must be ${UI_CHOICES.join('|')}`);
  if (!PREPROCESSOR_CHOICES.includes(opts.preprocessor)) {
    fail(`--preprocessor must be ${PREPROCESSOR_CHOICES.join('|')}`);
  }
  if (!CI_CHOICES.includes(opts.ci)) fail(`--ci must be ${CI_CHOICES.join('|')}`);
  return opts;
}

export async function collectOptions(argv = process.argv.slice(2)) {
  const flags = parseFlags(argv);
  if (flags.yes) {
    const name = flags.name;
    const prefix = flags.prefix;
    return validateOptions({
      name,
      prefix,
      cssPrefix: flags['css-prefix'] || (prefix ? prefix.toLowerCase() : undefined),
      installer: flags.installer || (name ? pascalFromName(name) : undefined),
      registry: flags.registry,
      ui: flags.ui || 'none',
      preprocessor: flags.preprocessor || 'none',
      ci: flags.ci || 'github',
      playground: !flags['no-playground'],
      license: flags.license || 'MIT',
    });
  }

  const name = await clack.text({ message: 'Package name (@acme/ui or acme-ui)' });
  if (clack.isCancel(name)) process.exit(1);
  const prefix = await clack.text({
    message: 'Component prefix (PascalCase, >=2)',
    defaultValue: 'Ac',
  });
  if (clack.isCancel(prefix)) process.exit(1);
  const cssPrefix = await clack.text({
    message: 'CSS prefix',
    defaultValue: String(prefix).toLowerCase(),
  });
  if (clack.isCancel(cssPrefix)) process.exit(1);
  const installer = await clack.text({
    message: 'Installer name',
    defaultValue: pascalFromName(String(name)),
  });
  if (clack.isCancel(installer)) process.exit(1);
  const registry = await clack.text({ message: 'npm registry URL (required)' });
  if (clack.isCancel(registry)) process.exit(1);
  const ui = await clack.select({
    message: 'UI framework',
    options: UI_CHOICES.map((v) => ({ value: v, label: v })),
  });
  if (clack.isCancel(ui)) process.exit(1);
  const preprocessor = await clack.select({
    message: 'CSS preprocessor (source only; published CSS stays CSS)',
    options: [
      { value: 'none', label: 'none', hint: 'plain CSS (default)' },
      { value: 'scss', label: 'scss', hint: 'sass-embedded, lang="scss"' },
      { value: 'less', label: 'less', hint: 'less, lang="less"' },
    ],
  });
  if (clack.isCancel(preprocessor)) process.exit(1);
  const ci = await clack.select({
    message: 'CI',
    options: CI_CHOICES.map((v) => ({ value: v, label: v })),
  });
  if (clack.isCancel(ci)) process.exit(1);
  const playground = await clack.confirm({ message: 'Keep playground?', initialValue: true });
  if (clack.isCancel(playground)) process.exit(1);
  const license = await clack.text({ message: 'License SPDX', defaultValue: 'MIT' });
  if (clack.isCancel(license)) process.exit(1);

  return validateOptions({
    name: String(name),
    prefix: String(prefix),
    cssPrefix: String(cssPrefix),
    installer: String(installer),
    registry: String(registry),
    ui,
    preprocessor,
    ci,
    playground: Boolean(playground),
    license: String(license),
  });
}

export function unscopedName(name) {
  return name.includes('/') ? name.split('/')[1] : name;
}

export function scopeOf(name) {
  if (!name.startsWith('@') || !name.includes('/')) return null;
  return name.split('/')[0];
}
