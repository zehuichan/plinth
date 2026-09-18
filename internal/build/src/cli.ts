import { check } from './contract/check.ts';
import { bundle } from './tasks/bundle.ts';
import { clean } from './tasks/clean.ts';

const cmd = process.argv[2] ?? 'build';

if (cmd === 'clean') {
  clean();
} else if (cmd === 'check') {
  const diffs = check();
  if (diffs.length) {
    console.error('check:contract failed:\n' + diffs.map((d) => `  - ${d}`).join('\n'));
    process.exit(1);
  }
} else {
  clean();
  const diffs = check();
  if (diffs.length) {
    console.error('check:contract failed:\n' + diffs.map((d) => `  - ${d}`).join('\n'));
    process.exit(1);
  }
  await bundle();
}
