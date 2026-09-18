import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  COMPONENTS_DIR,
  CORE_DIR,
  GENERATED_HEADER,
  HOOKS_DIR,
  REPO_ROOT,
  UTILS_DIR,
} from '../paths.ts';
import { derive, type Contract } from './derive.ts';

export interface GeneratedFiles {
  [path: string]: string;
}

function renderComponentsBarrel(contract: Contract): string {
  const lines = contract.components.map(
    (c) => `export { default as ${c.exportName} } from './${c.seg}';`,
  );
  return `${GENERATED_HEADER}\n${lines.join('\n')}\n`;
}

function renderInstaller(contract: Contract): string {
  const names = contract.components.map((c) => c.exportName);
  const imports = contract.components
    .map((c) => `import ${c.exportName} from '@internal/components/${c.seg}';`)
    .join('\n');
  const reexports = contract.components
    .map((c) => `export { default as ${c.exportName} } from '@internal/components/${c.seg}';`)
    .join('\n');
  const list = names.join(', ');
  return `${GENERATED_HEADER}
import { makeInstaller } from './make-installer';
${imports}

${reexports}

const components = [${list}];

export default makeInstaller(components);
`;
}

function renderResolverMap(contract: Contract): string {
  const rows = contract.components
    .map((c) => `  ${c.exportName}: { seg: '${c.seg}', hasStyle: ${c.hasStyle} },`)
    .join('\n');
  return `${GENERATED_HEADER}
export const COMPONENT_MAP = {
${rows}
} as const;

export type ComponentMap = typeof COMPONENT_MAP;
`;
}

function renderGlobalDts(contract: Contract): string {
  const names = contract.components.map((c) => c.exportName);
  const imports = names.length ? `import type { ${names.join(', ')} } from '@plinth/ui';` : '';
  const fields = names.map((n) => `    ${n}: typeof ${n};`).join('\n');
  return `${GENERATED_HEADER}
${imports}

declare module 'vue' {
  export interface GlobalComponents {
${fields}
  }
}

export {};
`;
}

function renderEntries(contract: Contract): string {
  const rows = contract.components
    .map(
      (c) =>
        `  '${c.seg}/index': '${join('packages/components', c.seg, 'index.ts').replaceAll('\\', '/')}',`,
    )
    .join('\n');
  return `${GENERATED_HEADER}
export const ES_ENTRIES = {
${rows}
} as const;
`;
}

function readCssPrefix(): string {
  const text = readFileSync(join(REPO_ROOT, 'lib.config.ts'), 'utf8');
  const cssPrefix = text.match(/cssPrefix:\s*'([^']+)'/)?.[1];
  if (!cssPrefix) throw new Error('lib.config.ts: cssPrefix not found');
  return cssPrefix;
}

export function renderCssPrefix(cssPrefix: string): string {
  return `${GENERATED_HEADER}
export const CSS_PREFIX = '${cssPrefix}';
`;
}

function renderHooksBarrel(contract: Contract): string {
  const lines = contract.hooks.map((h) => `export { ${h.exportName} } from './${h.name}';`);
  return `${GENERATED_HEADER}\n${lines.join('\n')}\n`;
}

export function renderAll(contract = derive()): GeneratedFiles {
  return {
    [join(COMPONENTS_DIR, 'index.ts')]: renderComponentsBarrel(contract),
    [join(CORE_DIR, 'component.ts')]: renderInstaller(contract),
    [join(CORE_DIR, 'resolver-map.ts')]: renderResolverMap(contract),
    [join(REPO_ROOT, 'typings/global.d.ts')]: renderGlobalDts(contract),
    [join(REPO_ROOT, 'internal/build/src/generated-entries.ts')]: renderEntries(contract),
    [join(HOOKS_DIR, 'index.ts')]: renderHooksBarrel(contract),
    [join(UTILS_DIR, 'css-prefix.ts')]: renderCssPrefix(readCssPrefix()),
  };
}

export function sync(contract = derive()): GeneratedFiles {
  const files = renderAll(contract);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  sync();
  console.log('contract:sync wrote generated files');
}
