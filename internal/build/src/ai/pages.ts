import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, posix, relative, resolve, sep } from 'node:path';

export type PageKind = 'guide' | 'components' | 'hooks';

export const PAGE_KINDS: readonly PageKind[] = ['guide', 'components', 'hooks'];

export interface DocPage {
  title: string;
  kind: PageKind;
  /** Page path without extension, e.g. `components/button` or `guide/ai/skills`. */
  slug: string;
  /** Markdown without frontmatter; `<demo>` tags are replaced by the demo source. */
  body: string;
}

export function normalizePath(value: string): string {
  return value.split(sep).join('/');
}

/**
 * Frontmatter is only recognized at the very start of the file (no `m` flag): a `---` block
 * further down is usually an example inside a code fence, e.g. docs/guide/component-sop.md.
 */
export function stripFrontmatter(content: string): string {
  return content.replace(/^---[\s\S]*?---\s*/, '').trim();
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function extractTitle(content: string): string {
  const frontmatter = content.match(/^---[\s\S]*?---/)?.[0];
  const frontTitle = frontmatter?.match(/^\s*title\s*:\s*(.+)$/m)?.[1]?.trim();
  if (frontTitle) return unquote(frontTitle);

  const heading = stripFrontmatter(content)
    .match(/^#\s+(.+)$/m)?.[1]
    ?.trim();
  return heading ? unquote(heading) : '';
}

// Reads one attribute of a `<demo vue="./demo/basic.vue" title="..." description="..." />` tag.
function getDemoAttr(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]+)"|'([^']+)')`));
  return match?.[1] ?? match?.[2];
}

function lastHeadingLevel(markdown: string): number {
  let level = 2;
  for (const match of markdown.matchAll(/^#{1,6}\s+/gm)) level = match[0].trim().length;
  return level;
}

function renderDemo(attrs: string, docPath: string, headingPrefix: string): string {
  const src = getDemoAttr(attrs, 'vue');
  if (!src) return '';

  // Demos sit under the page's own heading, so only add one when the tag has a `title`.
  const title = getDemoAttr(attrs, 'title');
  const description = getDemoAttr(attrs, 'description');
  const demoPath = resolve(dirname(docPath), src);
  try {
    const code = readFileSync(demoPath, 'utf8').trim();
    const lang = extname(src).slice(1) || 'vue';
    return [
      title ? `${headingPrefix} ${title}` : '',
      '',
      description ?? '',
      '',
      `\`\`\`${lang}`,
      code,
      '```',
      '',
    ]
      .filter(Boolean)
      .join('\n')
      .trimEnd();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      `Demo source not found: \`${normalizePath(relative(dirname(docPath), demoPath))}\``,
      '',
      `> ${message}`,
    ].join('\n');
  }
}

/** Replaces every `<demo vue="..." />` tag with the source of the demo it points to. */
export function injectDemoSources(content: string, docPath: string): string {
  let output = '';
  let lastIndex = 0;
  for (const match of content.matchAll(/<demo\b([^>]*?)\/>/g)) {
    const index = match.index ?? 0;
    const level = Math.min(lastHeadingLevel(content.slice(0, index)) + 1, 6);
    const rendered = renderDemo(match[1] ?? '', docPath, '#'.repeat(level));
    output += content.slice(lastIndex, index) + (rendered || match[0]);
    lastIndex = index + match[0].length;
  }
  return output + content.slice(lastIndex);
}

const CONTAINER_TITLES: Record<string, string> = {
  info: 'INFO',
  tip: 'TIP',
  warning: 'WARNING',
  danger: 'DANGER',
  details: 'DETAILS',
};

/** Containers that only change how VitePress renders their content; the content stays as is. */
const WRAPPER_CONTAINERS = new Set(['code-group', 'raw', 'v-pre']);

/**
 * Turns VitePress containers (`::: tip Title` ... `:::`) into block quotes, since other readers
 * of the markdown do not know the syntax. Wrapper containers (`::: code-group`) are dropped and
 * containers inside code fences are left alone.
 */
export function convertContainers(markdown: string): string {
  const out: string[] = [];
  let fence = '';
  let inContainer = false;
  for (const line of markdown.split('\n')) {
    const fenceMatch = /^\s*(```+|~~~+)/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1]!;
      if (!fence) fence = marker;
      else if (marker.startsWith(fence[0]!) && marker.length >= fence.length) fence = '';
    }
    if (fence || fenceMatch) {
      out.push(inContainer ? `> ${line}` : line);
      continue;
    }

    const open = /^:::\s*([\w-]+)\s*(.*)$/.exec(line);
    if (open && !inContainer) {
      const type = open[1]!;
      if (WRAPPER_CONTAINERS.has(type)) continue;
      inContainer = true;
      out.push(`> **${open[2]!.trim() || CONTAINER_TITLES[type] || type.toUpperCase()}**`);
    } else if (/^:::\s*$/.test(line)) {
      inContainer = false;
    } else {
      out.push(inContainer ? (line ? `> ${line}` : '>') : line);
    }
  }
  return out.join('\n');
}

function listMarkdown(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => join(dir, file));
}

function toSlug(docsRoot: string, file: string): string {
  return normalizePath(relative(docsRoot, file))
    .replace(/\.md$/, '')
    .replace(/\/index$/, '');
}

/**
 * Reads the docs pages the AI assets are built from. Pages are ordered by kind
 * (guide, components, hooks) and then by title.
 */
export function collectPages(docsRoot: string, kinds: readonly PageKind[] = PAGE_KINDS): DocPage[] {
  const pages: DocPage[] = [];
  for (const kind of kinds) {
    const ofKind: DocPage[] = [];
    for (const file of listMarkdown(join(docsRoot, kind))) {
      const content = readFileSync(file, 'utf8').trim();
      const title = extractTitle(content);
      if (!title) {
        console.warn(`ai: page has no title, skipped: ${file}`);
        continue;
      }
      const raw = stripFrontmatter(content);
      ofKind.push({
        title,
        kind,
        slug: toSlug(docsRoot, file),
        body: convertContainers(kind === 'guide' ? raw : injectDemoSources(raw, file)),
      });
    }
    pages.push(...ofKind.sort((a, b) => a.title.localeCompare(b.title)));
  }
  return pages;
}

/** The page as a standalone markdown file; pages already open with their own `# title`. */
export function renderPageMarkdown(page: DocPage): string {
  if (/^#\s/.test(page.body)) return `${page.body}\n`;
  return [`# ${page.title}`, '', page.body, ''].join('\n');
}

const SITE_LINK_RE = /\]\((\/[^)\s#]*)(#[^)\s]*)?\)/g;

/**
 * Rewrites site-absolute links (`/guide/consumer`) to relative links between the markdown
 * files written for the given slugs. Links to pages outside `slugs` are left untouched.
 */
export function rewriteSiteLinks(
  body: string,
  fromSlug: string,
  slugs: ReadonlySet<string>,
): string {
  return body.replace(SITE_LINK_RE, (whole, path: string, hash: string | undefined) => {
    const target = path.replace(/^\/+|\/+$/g, '');
    if (!slugs.has(target)) return whole;
    const rel = posix.relative(posix.dirname(fromSlug), target);
    const prefixed = rel.startsWith('.') ? rel : `./${rel}`;
    return `](${prefixed}.md${hash ?? ''})`;
  });
}
