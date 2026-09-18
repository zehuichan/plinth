import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import * as clack from '@clack/prompts';
import { camel, kebab } from './naming.mjs';
import * as templates from './templates.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));

function libConfig() {
  const text = readFileSync(join(root, 'lib.config.ts'), 'utf8');
  const read = (key, fallback) => text.match(new RegExp(`${key}:\\s*'([^']+)'`))?.[1] ?? fallback;
  return {
    pkgName: read('name', '@plinth/ui'),
    prefix: read('componentPrefix', 'Pl'),
    cssPrefix: read('cssPrefix', 'pl'),
    preprocessor: read('preprocessor', 'none'),
  };
}

function write(rel, content) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  return rel;
}

function contractSync() {
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules/tsx/dist/cli.mjs'),
      join(root, 'internal/build/src/contract/sync.ts'),
    ],
    { cwd: root, stdio: 'pipe' },
  );
}

function bail(message) {
  clack.cancel(message);
  process.exit(1);
}

function cancelled(value) {
  if (clack.isCancel(value)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return value;
}

async function askName({ message, placeholder, taken }) {
  return cancelled(
    await clack.text({
      message,
      placeholder,
      validate(value) {
        const input = String(value ?? '').trim();
        if (!input) return 'Required.';
        if (!/^[A-Za-z][A-Za-z0-9\s_-]*$/.test(input)) return 'Letters, digits, and dashes only.';
        if (existsSync(join(root, taken(kebab(input))))) return `${kebab(input)} already exists.`;
        return undefined;
      },
    }),
  );
}

async function genComponent(positional, flags) {
  const lib = libConfig();
  let name = positional;
  let withStyle = flags.style ?? !flags['no-style'];

  if (!name) {
    name = await askName({
      message: `Component name (no ${lib.prefix} prefix)`,
      placeholder: 'date-picker',
      taken: (seg) => `packages/components/${seg}`,
    });
    withStyle = cancelled(
      await clack.confirm({ message: 'Include <style> block?', initialValue: true }),
    );
  }

  const seg = kebab(name);
  if (existsSync(join(root, `packages/components/${seg}`)))
    bail(`packages/components/${seg} already exists.`);

  const data = { ...lib, name: seg, withStyle };
  const spinner = clack.spinner();
  spinner.start('Writing files');
  const written = [
    write(`packages/components/${seg}/index.ts`, templates.componentIndex(data)),
    write(`packages/components/${seg}/${seg}.vue`, templates.componentSfc(data)),
    write(`docs/components/${seg}/index.md`, templates.componentDocs(data)),
    write(`docs/components/${seg}/demo/basic.vue`, templates.componentDemo(data)),
  ];
  spinner.message('Syncing contract');
  contractSync();
  spinner.stop(`${lib.prefix}${seg} ready`);
  return written;
}

async function genHook(positional) {
  let name = positional;

  if (!name) {
    name = await askName({
      message: 'Hook name',
      placeholder: 'use-toggle',
      taken: (seg) => `packages/hooks/src/${seg}`,
    });
  }

  const seg = kebab(name);
  if (existsSync(join(root, `packages/hooks/src/${seg}`)))
    bail(`packages/hooks/src/${seg} already exists.`);

  const data = { name: seg };
  const spinner = clack.spinner();
  spinner.start('Writing files');
  const written = [
    write(`packages/hooks/src/${seg}/index.ts`, templates.hookIndex(data)),
    write(`docs/hooks/${seg}/index.md`, templates.hookDocs(data)),
  ];
  spinner.message('Syncing contract');
  contractSync();
  spinner.stop(`${camel(seg)} ready`);
  return written;
}

const { values: flags, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    style: { type: 'boolean' },
    'no-style': { type: 'boolean' },
  },
});

let [kind, name] = positionals;

clack.intro('plinth gen');

if (!kind) {
  kind = cancelled(
    await clack.select({
      message: 'What do you want to add?',
      options: [
        { value: 'component', label: 'component', hint: 'SFC + docs + demo' },
        { value: 'hook', label: 'hook', hint: 'composable + docs' },
        { value: 'sync', label: 'sync', hint: 'regenerate contract files only' },
      ],
    }),
  );
}

if (kind === 'component') {
  const written = await genComponent(name, flags);
  clack.outro(written.join('\n'));
} else if (kind === 'hook') {
  const written = await genHook(name);
  clack.outro(written.join('\n'));
} else if (kind === 'sync') {
  const spinner = clack.spinner();
  spinner.start('Syncing contract');
  contractSync();
  spinner.stop('Contract files up to date');
  clack.outro('done');
} else {
  bail(`Unknown target "${kind}". Use component | hook | sync.`);
}
