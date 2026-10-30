import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  collectPages,
  convertContainers,
  extractTitle,
  injectDemoSources,
  renderPageMarkdown,
  rewriteSiteLinks,
  stripFrontmatter,
} from './pages.ts';

describe('stripFrontmatter', () => {
  it('removes frontmatter at the start of the page', () => {
    expect(stripFrontmatter('---\ntitle: 按钮\n---\n\n# 按钮\n')).toBe('# 按钮');
  });

  it('keeps `---` blocks that appear later in the page (e.g. examples in code fences)', () => {
    const page = '# 新增组件\n\n```md\n---\ntitle: 日期选择器\n---\n```\n';
    expect(stripFrontmatter(page)).toBe(page.trim());
  });
});

describe('extractTitle', () => {
  it('prefers the frontmatter title', () => {
    expect(extractTitle('---\ntitle: "按钮"\n---\n\n# 其他\n')).toBe('按钮');
  });

  it('falls back to the first heading when there is no frontmatter', () => {
    expect(extractTitle('# 快速开始\n\n## 安装\n')).toBe('快速开始');
  });

  it('is not fooled by example frontmatter further down the page', () => {
    const page = '# 新增组件\n\n```md\n---\ntitle: 日期选择器\n---\n```\n';
    expect(extractTitle(page)).toBe('新增组件');
  });
});

describe('docs on disk', () => {
  const roots: string[] = [];

  function docsFixture(files: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), 'ai-pages-'));
    roots.push(root);
    for (const [name, content] of Object.entries(files)) {
      const file = join(root, name);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content);
    }
    return root;
  }

  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  it('replaces demo tags with the demo source under the heading that contains the tag', () => {
    const root = docsFixture({
      'components/card/index.md':
        '# Card\n\n## Basic\n\n<demo vue="./demo/basic.vue" title="Simple" description="A card." />\n\n## API\n',
      'components/card/demo/basic.vue': '<template><div /></template>\n',
    });
    const [page] = collectPages(root);
    expect(page!.body).toContain('### Simple\nA card.\n```vue\n<template><div /></template>\n```');
    expect(page!.body).not.toContain('<demo');
  });

  it('reports a demo that cannot be read instead of throwing', () => {
    const root = docsFixture({
      'components/card/index.md': '# Card\n\n<demo vue="./demo/missing.vue" />\n',
    });
    const [page] = collectPages(root);
    expect(page!.body).toContain('Demo source not found: `demo/missing.vue`');
  });

  it('collects pages by kind with index pages collapsed to their folder', () => {
    const root = docsFixture({
      'guide/start.md': '# Start\n',
      'guide/ai/skills.md': '# Skills\n',
      'components/card/index.md': '---\ntitle: Card\n---\n\n# Card\n',
      'hooks/use-flag/index.md': '# useFlag\n',
      'guide/untitled.md': 'no heading here\n',
    });
    expect(collectPages(root).map((p) => [p.kind, p.slug, p.title])).toEqual([
      ['guide', 'guide/ai/skills', 'Skills'],
      ['guide', 'guide/start', 'Start'],
      ['components', 'components/card', 'Card'],
      ['hooks', 'hooks/use-flag', 'useFlag'],
    ]);
    expect(collectPages(root, ['hooks']).map((p) => p.slug)).toEqual(['hooks/use-flag']);
  });

  it('returns nothing when the docs folder does not exist', () => {
    expect(collectPages(join(tmpdir(), 'ai-pages-does-not-exist'))).toEqual([]);
  });
});

describe('convertContainers', () => {
  it('turns tip-like containers into block quotes with their title', () => {
    expect(convertContainers('before\n\n::: info 示例组件\nfirst\n\nsecond\n:::\n\nafter')).toBe(
      'before\n\n> **示例组件**\n> first\n>\n> second\n\nafter',
    );
  });

  it('falls back to the container type when there is no title', () => {
    expect(convertContainers('::: warning\ncareful\n:::')).toBe('> **WARNING**\n> careful');
  });

  it('keeps the content of wrapper containers', () => {
    expect(convertContainers('::: code-group\n```ts [a.ts]\nx\n```\n:::')).toBe(
      '```ts [a.ts]\nx\n```',
    );
  });

  it('leaves containers inside code fences alone', () => {
    const page = '```md\n::: tip\nexample\n:::\n```';
    expect(convertContainers(page)).toBe(page);
  });

  it('quotes code fences that sit inside a container', () => {
    expect(convertContainers('::: tip\n```sh\nls\n```\n:::')).toBe(
      '> **TIP**\n> ```sh\n> ls\n> ```',
    );
  });
});

describe('injectDemoSources', () => {
  it('leaves tags without a vue attribute alone', () => {
    expect(injectDemoSources('<demo title="x" />', '/tmp/page.md')).toBe('<demo title="x" />');
  });
});

describe('renderPageMarkdown', () => {
  it('does not repeat a title the page already has', () => {
    expect(
      renderPageMarkdown({ title: 'A', kind: 'guide', slug: 'guide/a', body: '# A\n\ntext' }),
    ).toBe('# A\n\ntext\n');
  });

  it('adds the title when the body has none', () => {
    expect(renderPageMarkdown({ title: 'A', kind: 'guide', slug: 'guide/a', body: 'text' })).toBe(
      '# A\n\ntext\n',
    );
  });
});

describe('rewriteSiteLinks', () => {
  const slugs = new Set(['guide/consumer', 'components/card', 'guide/ai/skills']);

  it('points site links at the sibling markdown files', () => {
    const body = 'see [use](/guide/consumer#install) and [card](/components/card/)';
    expect(rewriteSiteLinks(body, 'components/card', slugs)).toBe(
      'see [use](../guide/consumer.md#install) and [card](./card.md)',
    );
    expect(rewriteSiteLinks('[s](/guide/ai/skills)', 'guide/consumer', slugs)).toBe(
      '[s](./ai/skills.md)',
    );
  });

  it('leaves unknown targets and external links untouched', () => {
    const body = '[a](/guide/other) [b](https://example.com/guide/consumer) [c](./local.md)';
    expect(rewriteSiteLinks(body, 'guide/consumer', slugs)).toBe(body);
  });
});
