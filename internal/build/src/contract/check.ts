import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { REPO_ROOT } from '../paths.ts';
import { renderAll } from './sync.ts';

export function check(): string[] {
  const expected = renderAll();
  const diffs: string[] = [];
  for (const [path, content] of Object.entries(expected)) {
    if (!existsSync(path)) {
      diffs.push(`missing ${relative(REPO_ROOT, path)}`);
      continue;
    }
    const actual = readFileSync(path, 'utf8');
    if (actual !== content) diffs.push(`stale ${relative(REPO_ROOT, path)}`);
  }
  return diffs;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const diffs = check();
  if (diffs.length) {
    console.error('check:contract failed:\n' + diffs.map((d) => `  - ${d}`).join('\n'));
    console.error('Run `pnpm contract:sync` and commit the result.');
    process.exit(1);
  }
  console.log('check:contract ok');
}
