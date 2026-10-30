import { describe, expect, it } from 'vitest';
import { renderLlmsFull, renderLlmsTxt } from './llms.ts';
import type { DocPage } from './pages.ts';

const pages: DocPage[] = [
  { title: 'Start', kind: 'guide', slug: 'guide/start', body: '# Start\n\nhello' },
  { title: 'Card', kind: 'components', slug: 'components/card', body: '# Card\n\nA card.' },
];
const site = { title: '@acme/ui', description: 'Acme components', url: 'https://acme.dev/ui' };

describe('renderLlmsTxt', () => {
  it('links every page and leaves out sections without pages', () => {
    const txt = renderLlmsTxt(pages, site);
    expect(txt).toContain('# @acme/ui\n\n> Acme components');
    expect(txt).toContain('- [Full Documentation](./llms-full.txt)');
    expect(txt).toContain('## Docs\n\n- [Start](https://acme.dev/ui/guide/start.md)');
    expect(txt).toContain('## Component Docs\n\n- [Card](https://acme.dev/ui/components/card.md)');
    expect(txt).not.toContain('## Hook Docs');
    expect(txt).not.toContain('## Design');
  });

  it('keeps links root-relative without a site url', () => {
    expect(renderLlmsTxt(pages, { ...site, url: '' })).toContain('- [Start](/guide/start.md)');
  });

  it('links design.md when the site serves it', () => {
    expect(renderLlmsTxt(pages, site, { designMd: true })).toContain(
      '## Design\n\n- [design.md](https://acme.dev/ui/design.md)',
    );
  });
});

describe('renderLlmsFull', () => {
  it('concatenates the pages under a header with their title and url', () => {
    const full = renderLlmsFull(pages, site);
    expect(full).toContain(
      '---\nTitle: Start\nURL: https://acme.dev/ui/guide/start.md\n---\n\n# Start\n\nhello',
    );
    expect(full.indexOf('Title: Start')).toBeLessThan(full.indexOf('Title: Card'));
  });
});
