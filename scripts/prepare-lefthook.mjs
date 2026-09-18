import { execSync } from 'node:child_process';

try {
  execSync('lefthook install', { stdio: 'inherit' });
} catch {
  // Not a git checkout (template copy, CI cache). Skip.
}
