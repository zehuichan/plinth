import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { groupTokens, parseTokens, renderDesignMd, scanComponentTokens } from './design-md.ts';

const css = `
/* brand */
:root {
  --ac-color-primary: #1677ff;
  --ac-color-primary-hover: var(--ac-color-primary);
  --ac-color-text: #1f1f1f;
  --ac-color-tint: color-mix(in srgb, var(--ac-color-text) 10%, transparent);
  --ac-color-glass: var(--host-surface);
  --ac-radius-md: 6px;
  --ac-space-sm: 8px;
  --ac-font-family: "Inter", sans-serif;
  --ac-font-size-body: 14px;
  --ac-font-weight: 400;
  --ac-line-height: 1.5;
  --ac-z-modal: 1000;
  --other-color-x: red;
}
[data-theme='dark'] {
  --ac-color-text: #ffffff;
}
`;

describe('parseTokens', () => {
  it('reads prefixed declarations, resolves references and keeps the first value', () => {
    const tokens = parseTokens(css, 'ac');
    const byName = Object.fromEntries(tokens.map((t) => [t.name, t.value]));
    expect(byName['color-primary']).toBe('#1677ff');
    expect(byName['color-primary-hover']).toBe('#1677ff');
    expect(byName['color-text']).toBe('#1f1f1f');
    expect(byName['color-x']).toBeUndefined();
  });

  it('leaves references it cannot resolve in place', () => {
    const [token] = parseTokens(':root { --ac-a: var(--ac-missing); }', 'ac');
    expect(token).toEqual({ name: 'a', value: 'var(--ac-missing)' });
  });
});

describe('groupTokens', () => {
  const groups = groupTokens(parseTokens(css, 'ac'));

  it('sorts tokens by naming convention', () => {
    expect(groups.colors).toEqual({
      primary: '#1677ff',
      'primary-hover': '#1677ff',
      text: '#1f1f1f',
      // The reference is inlined, which leaves a literal color the spec accepts.
      tint: 'color-mix(in srgb, #1f1f1f 10%, transparent)',
    });
    expect(groups.rounded).toEqual({ md: '6px' });
    expect(groups.spacing).toEqual({ sm: '8px' });
    expect(groups.typography).toEqual({
      body: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.5,
      },
    });
  });

  it('keeps unconventional or non-literal tokens out of the groups', () => {
    expect(groups.other.map((t) => t.name)).toEqual(['color-glass', 'z-modal']);
  });

  it('does not turn font companions into typography without a font-size level', () => {
    const only = groupTokens([{ name: 'font-family', value: 'Inter' }]);
    expect(only.typography).toEqual({});
    expect(only.other).toEqual([{ name: 'font-family', value: 'Inter' }]);
  });
});

describe('renderDesignMd', () => {
  const input = {
    name: '@acme/ui',
    description: 'Acme components',
    cssPrefix: 'ac',
    tokens: parseTokens(css, 'ac'),
    components: [
      { names: ['AcButton'], tokens: ['color-primary', 'color-text'] },
      { names: ['AcRadio', 'AcRadioButton'], tokens: ['color-primary'] },
      { names: ['AcIcon'], tokens: [] },
    ],
  };
  const md = renderDesignMd(input);

  it('puts the token groups in the front matter', () => {
    const frontMatter = md.split('---')[1]!;
    expect(frontMatter).toContain('version: "alpha"');
    expect(frontMatter).toContain('name: "@acme/ui"');
    expect(frontMatter).toContain('colors:\n  primary: "#1677ff"');
    expect(frontMatter).toContain('rounded:\n  md: "6px"');
    expect(frontMatter).toContain('fontWeight: 400');
    expect(frontMatter).toContain('lineHeight: 1.5');
    expect(frontMatter).toContain('  - section: "components"');
  });

  it('writes the sections in spec order and names the variables with the prefix', () => {
    const headings = [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings).toEqual([
      'Overview',
      'Colors',
      'Typography',
      'Layout',
      'Shapes',
      'Components',
      "Do's and Don'ts",
      'Other Tokens',
    ]);
    expect(md).toContain('- **primary (#1677ff):** `--ac-color-primary`, brand color');
    expect(md).toContain(
      '- **AcRadio** (`<ac-radio>`), **AcRadioButton** (`<ac-radio-button>`): `--ac-color-primary`',
    );
  });

  it('skips components that read no tokens', () => {
    expect(md).not.toContain('AcIcon');
  });

  it('declares empty groups as omitted instead of writing empty sections', () => {
    const bare = renderDesignMd({ ...input, tokens: [], components: [] });
    expect(bare).toContain('  - section: "colors"');
    expect(bare).toContain('  - section: "spacing"');
    expect(bare).not.toContain('## Colors');
    expect(bare).not.toContain('## Components');
  });
});

describe('scanComponentTokens', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  it('collects variables from styles and skips demos and node_modules', () => {
    const root = mkdtempSync(join(tmpdir(), 'ai-design-'));
    roots.push(root);
    const files: Record<string, string> = {
      'card.vue':
        '<style>.ac-card { color: var(--ac-color-text); border: 1px solid var( --ac-color-border ); }</style>',
      'style/card.scss': '.ac-card__x { padding: var(--ac-space-sm, 4px); }',
      'demo/basic.vue': '<style>a { color: var(--ac-color-demo); }</style>',
      'node_modules/dep/index.css': 'a { color: var(--ac-color-dep); }',
      'card.test.ts': "expect('var(--ac-color-test)')",
    };
    for (const [name, content] of Object.entries(files)) {
      mkdirSync(dirname(join(root, name)), { recursive: true });
      writeFileSync(join(root, name), content);
    }
    expect(scanComponentTokens(root, 'ac')).toEqual(['color-border', 'color-text', 'space-sm']);
  });

  it('returns nothing for a folder that does not exist', () => {
    expect(scanComponentTokens(join(tmpdir(), 'ai-design-missing'), 'ac')).toEqual([]);
  });
});
