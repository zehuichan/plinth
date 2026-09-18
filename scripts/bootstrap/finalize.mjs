import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SENTINELS = ['@plinth/ui', 'PlinthResolver', 'PlButton', '--pl-', 'Plinth'];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (['.git', 'node_modules', 'dist', 'es', '.turbo', '.cache'].includes(name)) continue;
    if (name === 'pnpm-lock.yaml') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

export function assertNoSentinels(root) {
  const hits = [];
  for (const file of walk(root)) {
    if (file.includes(`${join('scripts', 'bootstrap')}`)) continue;
    const text = readFileSync(file, 'utf8');
    for (const token of SENTINELS) {
      if (text.includes(token)) hits.push(`${file}: ${token}`);
    }
  }
  if (hits.length) {
    throw new Error(`sentinel leftovers:\n${hits.join('\n')}`);
  }
}

export function stripReadme(root) {
  const path = join(root, 'README.md');
  let text = readFileSync(path, 'utf8');
  text = text.replace(
    /<!-- template:foundation-start -->[\s\S]*?<!-- template:foundation-end -->\s*/g,
    '',
  );
  text = text
    .replace(/<!-- template:library-start -->\s*/g, '')
    .replace(/<!-- template:library-end -->\s*/g, '');
  writeFileSync(path, text.trimStart());
}

export function removeBootstrap(root) {
  rmSync(join(root, 'scripts/bootstrap'), { recursive: true, force: true });
  const pkgPath = join(root, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  delete pkg.scripts.bootstrap;
  delete pkg.devDependencies['validate-npm-package-name'];
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

export function finalize(root) {
  stripReadme(root);
  assertNoSentinels(root);
  removeBootstrap(root);
  console.log('Bootstrap done. Next: pnpm install && pnpm verify');
}
