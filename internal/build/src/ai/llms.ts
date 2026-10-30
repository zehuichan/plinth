import type { DocPage } from './pages.ts';

export interface SiteInfo {
  title: string;
  description: string;
  /** Site origin plus base path without a trailing slash; empty keeps links root-relative. */
  url: string;
}

export interface LlmsAssets {
  /** The site also serves `/design.md`. */
  designMd?: boolean;
}

export function pageUrl(site: SiteInfo, page: DocPage): string {
  return `${site.url}/${page.slug}.md`;
}

function links(site: SiteInfo, pages: DocPage[]): string[] {
  return pages.map((page) => `- [${page.title}](${pageUrl(site, page)})`);
}

/** The `llms.txt` index: a short navigation file that links every page's markdown. */
export function renderLlmsTxt(pages: DocPage[], site: SiteInfo, assets: LlmsAssets = {}): string {
  const sections: Array<[heading: string, lines: string[]]> = [
    [
      'Docs',
      links(
        site,
        pages.filter((page) => page.kind === 'guide'),
      ),
    ],
    [
      'Component Docs',
      links(
        site,
        pages.filter((page) => page.kind === 'components'),
      ),
    ],
    [
      'Hook Docs',
      links(
        site,
        pages.filter((page) => page.kind === 'hooks'),
      ),
    ],
    ['Design', assets.designMd ? [`- [design.md](${site.url}/design.md)`] : []],
  ];

  return [
    `# ${site.title}`,
    '',
    `> ${site.description}`,
    '',
    '## Navigation',
    '',
    '- [Full Documentation](./llms-full.txt)',
    '',
    ...sections
      .filter(([, lines]) => lines.length > 0)
      .flatMap(([heading, lines]) => [`## ${heading}`, '', ...lines, '']),
  ].join('\n');
}

/** The `llms-full.txt` file: every page, with its URL, in one document. */
export function renderLlmsFull(pages: DocPage[], site: SiteInfo): string {
  return [
    `# ${site.title}`,
    '',
    `> ${site.description}`,
    '',
    ...pages.map((page) =>
      ['---', `Title: ${page.title}`, `URL: ${pageUrl(site, page)}`, '---', '', page.body, ''].join(
        '\n',
      ),
    ),
  ].join('\n');
}
