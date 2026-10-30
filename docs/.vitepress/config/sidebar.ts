import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { DefaultTheme } from 'vitepress';

interface PageMeta {
  title: string;
  group: string;
  order: number;
  link: string;
}

function parseFrontmatter(file: string): { title: string; group: string; order: number } {
  const text = readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const raw = match?.[1] ?? '';
  const title = raw.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? '';
  const group = raw.match(/^group:\s*(.+)$/m)?.[1]?.trim() ?? '其他';
  const order = Number(raw.match(/^order:\s*(\d+)/m)?.[1] ?? Number.MAX_SAFE_INTEGER);
  return { title, group, order };
}

function collect(root: string, prefix: string): PageMeta[] {
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) return [];
  const pages: PageMeta[] = [];
  for (const name of readdirSync(root)) {
    const index = join(root, name, 'index.md');
    if (!statSync(index, { throwIfNoEntry: false })?.isFile()) continue;
    const meta = parseFrontmatter(index);
    pages.push({
      ...meta,
      title: meta.title || name,
      link: `/${prefix}/${name}/`,
    });
  }
  return pages.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function deriveSidebar(docsRoot: string): DefaultTheme.Sidebar {
  const components = collect(join(docsRoot, 'components'), 'components');
  const hooks = collect(join(docsRoot, 'hooks'), 'hooks');

  const grouped = new Map<string, PageMeta[]>();
  for (const page of components) {
    const list = grouped.get(page.group) ?? [];
    list.push(page);
    grouped.set(page.group, list);
  }

  const componentSection: DefaultTheme.SidebarItem[] = [...grouped.entries()].map(
    ([group, items]) => ({
      text: group,
      items: items.map((p) => ({ text: p.title, link: p.link })),
    }),
  );

  return {
    '/guide/': [
      {
        text: '上手',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '新增组件', link: '/guide/component-sop' },
        ],
      },
      {
        text: 'AI',
        items: [
          { text: '给 AI 助手', link: '/guide/ai/for-agents' },
          { text: 'Design.md', link: '/guide/ai/design-md' },
          { text: 'LLMs.txt', link: '/guide/ai/llms' },
          { text: 'Skills', link: '/guide/ai/skills' },
        ],
      },
      {
        text: '样式与选型',
        items: [
          { text: '样式规范', link: '/guide/styling' },
          { text: 'UI 框架', link: '/guide/ui-framework' },
        ],
      },
      {
        text: '交付与演进',
        items: [
          { text: '使用组件库', link: '/guide/consumer' },
          { text: '发布', link: '/guide/release' },
          { text: '拆分组合式函数', link: '/guide/split-hooks' },
        ],
      },
    ],
    '/components/': componentSection,
    '/hooks/': [
      {
        text: '组合式函数',
        items: hooks.map((p) => ({ text: p.title, link: p.link })),
      },
    ],
  };
}
