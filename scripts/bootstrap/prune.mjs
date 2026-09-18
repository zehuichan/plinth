import { rmSync } from 'node:fs';
import { join } from 'node:path';

export function prune(root, opts) {
  rmSync(join(root, '.github/workflows/template-e2e.yml'), { force: true });
  if (!opts.playground) {
    rmSync(join(root, 'playground'), { recursive: true, force: true });
  }
  if (opts.ci === 'none') {
    rmSync(join(root, '.github/workflows/ci.yml'), { force: true });
    rmSync(join(root, '.gitlab-ci.yml'), { force: true });
  } else if (opts.ci === 'gitlab') {
    rmSync(join(root, '.github/workflows/ci.yml'), { force: true });
  } else {
    rmSync(join(root, '.gitlab-ci.yml'), { force: true });
  }
}
