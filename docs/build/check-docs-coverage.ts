import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { derive } from '@internal/build';

const docsRoot = fileURLToPath(new URL('..', import.meta.url));
const contract = derive();
const missing: string[] = [];

for (const c of contract.components) {
  const page = join(docsRoot, 'components', c.seg, 'index.md');
  if (!existsSync(page)) missing.push(`docs/components/${c.seg}/index.md`);
}
for (const h of contract.hooks) {
  const page = join(docsRoot, 'hooks', h.name, 'index.md');
  if (!existsSync(page)) missing.push(`docs/hooks/${h.name}/index.md`);
}

if (missing.length) {
  console.error('check:docs failed, missing:\n' + missing.map((m) => `  - ${m}`).join('\n'));
  process.exit(1);
}
console.log('check:docs ok');
