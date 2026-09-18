import { rmSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const hard = process.argv.includes('--hard');
const delLock = process.argv.includes('--del-lock');

const dirs = ['.turbo', '.cache', 'coverage', 'docs/.vitepress/cache', 'docs/.vitepress/dist'];
const pkgOut = ['dist', 'es'];

for (const dir of dirs) rmSync(join(root, dir), { recursive: true, force: true });

if (hard) {
  for (const pkg of ['packages/core', 'packages/components', 'packages/hooks', 'packages/utils']) {
    for (const out of pkgOut) rmSync(join(root, pkg, out), { recursive: true, force: true });
  }
  rmSync(join(root, 'node_modules'), { recursive: true, force: true });
}

if (delLock) rmSync(join(root, 'pnpm-lock.yaml'), { force: true });

console.log('clean done');
