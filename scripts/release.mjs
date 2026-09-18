import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const dryRun = process.argv.includes('--dry-run');
const root = import.meta.dirname + '/..';

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

function capture(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
}

if (capture('git status --porcelain')) {
  console.error('Working tree is not clean.');
  process.exit(1);
}

run('pnpm exec changeset version');

if (dryRun) {
  console.log('dry-run: skipping verify / commit / publish / tag');
  process.exit(0);
}

run('pnpm verify');

// -A, not -u: the first release of a package creates an untracked CHANGELOG.md.
run('git add -A');
const status = capture('git status --porcelain');
if (!status) {
  console.log('No version changes to commit.');
  process.exit(0);
}

const pkg = JSON.parse(
  readFileSync(new URL('../packages/core/package.json', import.meta.url), 'utf8'),
);
run(`git commit -m "chore: release ${pkg.name}@${pkg.version}"`);
const head = capture('git rev-parse HEAD');
run('pnpm -r publish --access public --no-git-checks');
run('pnpm exec changeset tag');

const tags = capture('git tag --points-at HEAD').split('\n').filter(Boolean);
if (!tags.length) {
  console.error(`changeset tag did not point at ${head}`);
  process.exit(1);
}
console.log(`tagged ${tags.join(', ')} at ${head} (not pushed)`);
