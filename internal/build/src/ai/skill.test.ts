import { describe, expect, it } from 'vitest';
import type { LibConfig } from '../config.ts';
import type { Contract } from '../contract/derive.ts';
import { skillName } from './names.ts';
import type { DocPage } from './pages.ts';
import { renderSkill } from './skill.ts';

const lib: LibConfig = {
  name: '@acme/ui',
  installerName: 'Acme',
  installer: { skip: [] },
  componentPrefix: 'Ac',
  cssPrefix: 'ac',
  preprocessor: 'none',
  formats: ['es'],
  styles: 'inject',
};

const contract: Contract = {
  components: [
    { seg: 'card', exportName: 'AcCard', source: './card.vue', hasStyle: true },
    { seg: 'badge', exportName: 'AcBadge', source: './badge.vue', hasStyle: true },
  ],
  hooks: [{ name: 'use-flag', exportName: 'useFlag' }],
};

const pages: DocPage[] = [
  {
    title: '使用组件库',
    kind: 'guide',
    slug: 'guide/consumer',
    body: '# 使用组件库\n\n见[卡片](/components/card/)',
  },
  { title: '发布', kind: 'guide', slug: 'guide/release', body: '# 发布\n' },
  {
    title: '卡片',
    kind: 'components',
    slug: 'components/card',
    body: '# 卡片\n\n回到[使用](/guide/consumer#install)',
  },
  { title: 'useFlag', kind: 'hooks', slug: 'hooks/use-flag', body: '# useFlag\n' },
];

const input = {
  lib,
  version: '1.2.3',
  description: 'Acme components',
  contract,
  pages,
  designMd: '# design\n',
};

describe('skillName', () => {
  it('turns package names into skill names', () => {
    expect(skillName('@acme/ui')).toBe('acme-ui');
    expect(skillName('acme-ui')).toBe('acme-ui');
    expect(skillName('@Acme/UI_Kit')).toBe('acme-ui-kit');
  });

  it('keeps names within 64 characters and rejects unusable ones', () => {
    expect(skillName(`@acme/${'x'.repeat(100)}`).length).toBeLessThanOrEqual(64);
    expect(() => skillName('@/')).toThrow(/skill name/);
  });
});

describe('renderSkill', () => {
  const files = renderSkill(input);
  const skill = files.get('SKILL.md')!;

  it('ships the skill file, the design reference and one reference per consumer-facing page', () => {
    expect([...files.keys()].sort()).toEqual([
      'SKILL.md',
      'references/components/card.md',
      'references/design.md',
      'references/guide/consumer.md',
      'references/hooks/use-flag.md',
    ]);
  });

  it('opens with the frontmatter agents match on', () => {
    const match = skill.match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
    expect(match?.[1]).toBe('acme-ui');
    const description = JSON.parse(match![2]!) as string;
    expect(description).toContain('@acme/ui');
    expect(description).toContain('<ac-card>');
    expect(description.length).toBeLessThanOrEqual(1024);
  });

  it('takes every name from the library config', () => {
    expect(skill).toContain('pnpm add @acme/ui');
    expect(skill).toContain("import Acme from '@acme/ui';");
    expect(skill).toContain("import { AcmeResolver } from '@acme/ui/resolver';");
    expect(skill).toContain("import { AcCard } from '@acme/ui/es/card'");
    expect(skill).toContain('`--ac-*`');
    expect(skill).toContain('matches the installed version (1.2.3)');
  });

  it('lists components and composables with links to their references', () => {
    expect(skill).toContain('| `AcCard` | `<ac-card>` | [卡片](references/components/card.md) |');
    expect(skill).toContain('| `AcBadge` | `<ac-badge>` | (no docs page) |');
    expect(skill).toContain('| `useFlag` | [useFlag](references/hooks/use-flag.md) |');
    expect(skill).toContain('[使用组件库](references/guide/consumer.md)');
  });

  it('rewrites site links between references and leaves no blank line pile-ups', () => {
    expect(files.get('references/components/card.md')).toContain(
      '[使用](../guide/consumer.md#install)',
    );
    expect(files.get('references/guide/consumer.md')).toContain('[卡片](../components/card.md)');
    expect(skill).not.toMatch(/\n\n\n/);
  });

  it('adds the docs link only when the library has a docs site', () => {
    expect(skill).not.toContain('## More');
    const withDocs = renderSkill({ ...input, lib: { ...lib, docsUrl: 'https://acme.dev/ui' } });
    expect(withDocs.get('SKILL.md')).toContain(
      '## More\n\nFull documentation: https://acme.dev/ui',
    );
  });

  it('still produces a valid skill for a library without components or docs', () => {
    const empty = renderSkill({ ...input, contract: { components: [], hooks: [] }, pages: [] });
    const text = empty.get('SKILL.md')!;
    expect(text).toContain('No components are published yet.');
    expect(text).not.toContain('## Composables');
    expect([...empty.keys()].sort()).toEqual(['SKILL.md', 'references/design.md']);
  });
});
