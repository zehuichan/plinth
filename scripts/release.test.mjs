import { describe, expect, it } from 'vitest';

describe('release.mjs', () => {
  it('refuses a dirty tree by checking git status in the script source', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('./release.mjs', import.meta.url), 'utf8');
    expect(src).toContain('git status --porcelain');
    expect(src).toContain('changeset version');
    expect(src).toContain('changeset tag');
    expect(src).not.toContain('git push');
  });
});
