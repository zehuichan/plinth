import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { CORE_DIR } from '../paths.ts';

export function clean(): void {
  for (const dir of ['dist', 'es']) {
    rmSync(join(CORE_DIR, dir), { recursive: true, force: true });
  }
}
