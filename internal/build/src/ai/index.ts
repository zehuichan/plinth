import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { LibConfig } from '../config.ts';
import { derive, type Contract } from '../contract/derive.ts';
import { CORE_DIR, DOCS_DIR, REPO_ROOT } from '../paths.ts';
import { buildDesignMd } from './design-md.ts';
import { renderLlmsFull, renderLlmsTxt } from './llms.ts';
import { skillName } from './names.ts';
import { collectPages, renderPageMarkdown } from './pages.ts';
import { renderSkill } from './skill.ts';

export { buildDesignMd, groupTokens, parseTokens, renderDesignMd } from './design-md.ts';
export { renderLlmsFull, renderLlmsTxt } from './llms.ts';
export { hyphenate, skillName } from './names.ts';
export { collectPages, renderPageMarkdown, rewriteSiteLinks, type DocPage } from './pages.ts';
export { renderSkill } from './skill.ts';

interface CoreManifest {
  version: string;
  description?: string;
}

function readCoreManifest(): CoreManifest {
  return JSON.parse(readFileSync(join(CORE_DIR, 'package.json'), 'utf8')) as CoreManifest;
}

function writeAll(root: string, files: Map<string, string>): void {
  for (const [path, content] of files) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}

/**
 * Writes the agent skill into `packages/core/dist/skills/<name>/`. `skills experimental_sync`
 * looks for `dist/skills/<name>/SKILL.md` in installed packages, so the skill travels with the
 * package and always matches the version a project has installed.
 */
export function emitSkill(lib: LibConfig, contract: Contract = derive()): string {
  const manifest = readCoreManifest();
  const files = renderSkill({
    lib,
    version: manifest.version,
    description: manifest.description ?? `${lib.name} component library`,
    contract,
    pages: collectPages(DOCS_DIR),
    designMd: buildDesignMd(lib, contract),
  });

  const skillsDir = join(CORE_DIR, 'dist/skills');
  rmSync(skillsDir, { recursive: true, force: true });
  const dir = join(skillsDir, skillName(lib.name));
  writeAll(dir, files);
  return dir;
}

export interface SiteOptions {
  /** Site origin plus base path, e.g. `https://example.com/ui`. Defaults to `docsUrl`. */
  siteUrl?: string;
  /** Folder to write into, resolved from the repository root. Defaults to `docs/public`. */
  outputDir?: string;
}

/**
 * Writes the files a docs site serves for AI tools: `llms.txt`, `llms-full.txt`, `design.md`
 * and one markdown file per docs page (`/components/button.md`). VitePress copies `docs/public`
 * to the site root, so the paths above are the public URLs.
 */
export function emitSite(
  lib: LibConfig,
  options: SiteOptions = {},
  contract: Contract = derive(),
): { outputDir: string; pages: number } {
  const manifest = readCoreManifest();
  const outputDir = options.outputDir
    ? resolve(REPO_ROOT, options.outputDir)
    : join(DOCS_DIR, 'public');
  const site = {
    title: lib.name,
    description: manifest.description ?? `${lib.name} component library`,
    url: (options.siteUrl ?? lib.docsUrl ?? '').replace(/\/+$/, ''),
  };
  const pages = collectPages(DOCS_DIR);

  const files = new Map<string, string>([
    ['llms.txt', renderLlmsTxt(pages, site, { designMd: true })],
    ['llms-full.txt', renderLlmsFull(pages, site)],
    ['design.md', buildDesignMd(lib, contract)],
  ]);
  for (const page of pages) files.set(`${page.slug}.md`, renderPageMarkdown(page));

  writeAll(outputDir, files);
  return { outputDir, pages: pages.length };
}
