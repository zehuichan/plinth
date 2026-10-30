import type { LibConfig } from '../config.ts';
import type { Contract } from '../contract/derive.ts';
import { hyphenate, skillName } from './names.ts';
import { renderPageMarkdown, rewriteSiteLinks, type DocPage } from './pages.ts';

export interface SkillInput {
  lib: LibConfig;
  version: string;
  description: string;
  contract: Contract;
  pages: DocPage[];
  /** Rendered design.md, shipped as a reference. */
  designMd: string;
}

/** Guide pages written for people who use the library, not for the ones who build it. */
const CONSUMER_GUIDES = new Set(['guide/consumer']);

function isReference(page: DocPage): boolean {
  return page.kind !== 'guide' || CONSUMER_GUIDES.has(page.slug);
}

function frontmatter(name: string, description: string): string {
  return ['---', `name: ${name}`, `description: ${JSON.stringify(description)}`, '---'].join('\n');
}

function skillDescription(lib: LibConfig, sample: string): string {
  const tag = hyphenate(sample);
  return (
    `Use the ${lib.name} Vue 3 component library correctly: setup, ${lib.componentPrefix}* components with their props, events and slots, ` +
    `composables, CSS variables and theming. Use when writing or reviewing Vue code that imports from "${lib.name}", ` +
    `uses <${tag}> style tags, or when asked how to install, theme or customize ${lib.name}.`
  );
}

/**
 * Builds the files of the agent skill that ships inside the npm package, keyed by their path
 * relative to the skill folder. Agents read `SKILL.md` first and open references on demand, so
 * the reference files are the docs pages themselves (API tables and demo sources included).
 */
export function renderSkill(input: SkillInput): Map<string, string> {
  const { lib, contract, version } = input;
  const name = skillName(lib.name);
  const references = input.pages.filter(isReference);
  const slugs = new Set(references.map((page) => page.slug));
  const bySlug = new Map(references.map((page) => [page.slug, page]));

  const files = new Map<string, string>();
  for (const page of references) {
    files.set(
      `references/${page.slug}.md`,
      renderPageMarkdown({ ...page, body: rewriteSiteLinks(page.body, page.slug, slugs) }),
    );
  }
  files.set('references/design.md', input.designMd);

  const sample = contract.components[0]?.exportName ?? `${lib.componentPrefix}Button`;
  const sampleSeg = contract.components[0]?.seg ?? 'button';
  const installer = lib.installerName;

  const componentRows = contract.components.map((component) => {
    const page = bySlug.get(`components/${component.seg}`);
    const reference = page ? `[${page.title}](references/${page.slug}.md)` : '(no docs page)';
    return `| \`${component.exportName}\` | \`<${hyphenate(component.exportName)}>\` | ${reference} |`;
  });
  const hookRows = contract.hooks.map((hook) => {
    const page = bySlug.get(`hooks/${hook.name}`);
    return `| \`${hook.exportName}\` | ${page ? `[${page.title}](references/${page.slug}.md)` : '(no docs page)'} |`;
  });
  const consumerGuide = bySlug.get('guide/consumer');

  const body = [
    `# ${lib.name}`,
    '',
    `${input.description}. This skill ships inside the package, so everything below matches the installed version (${version}).`,
    '',
    '## How to use this skill',
    '',
    '1. Find the component or composable you need in the tables below.',
    '2. Open its reference before writing code. It lists the real props, events and slots and includes a runnable demo. Do not guess an API from another component library.',
    '3. Import only from the public entries described under "Setup".',
    '',
    '## Setup',
    '',
    '```bash',
    `pnpm add ${lib.name}`,
    '```',
    '',
    'Register every component and load the full stylesheet:',
    '',
    '```ts',
    "import { createApp } from 'vue';",
    `import ${installer} from '${lib.name}';`,
    `import '${lib.name}/style.css';`,
    '',
    `createApp(App).use(${installer}).mount('#app');`,
    '```',
    '',
    'Or import on demand with `unplugin-vue-components`:',
    '',
    '```ts',
    "import Components from 'unplugin-vue-components/vite';",
    `import { ${installer}Resolver } from '${lib.name}/resolver';`,
    '',
    `Components({ resolvers: [${installer}Resolver()] });`,
    '```',
    '',
    `On-demand and per-component imports (\`import { ${sample} } from '${lib.name}/es/${sampleSeg}'\`) need the token layer once at the app entry: \`import '${lib.name}/tokens.css'\`. \`style.css\` already contains it, so do not import both.`,
    '',
    `For TypeScript templates add \`"types": ["${lib.name}/global"]\` to \`compilerOptions\`.`,
    '',
    ...(consumerGuide
      ? [
          `Private registries, build modes and troubleshooting: [${consumerGuide.title}](references/${consumerGuide.slug}.md).`,
          '',
        ]
      : []),
    '## Conventions',
    '',
    `- Components are exported as \`${sample}\` and work in templates as \`<${sample}>\` or \`<${hyphenate(sample)}>\`.`,
    `- Styling is driven by CSS variables named \`--${lib.cssPrefix}-*\`. Re-theme by overriding them on \`:root\` or a wrapper element; do not hardcode brand colors or edit files in \`node_modules\`.`,
    `- Class names follow BEM with the \`${lib.cssPrefix}-\` prefix (\`${lib.cssPrefix}-button\`, \`${lib.cssPrefix}-button--primary\`); state classes look like \`is-disabled\`. Treat them as an implementation detail and prefer props and variables.`,
    '- [references/design.md](references/design.md) lists the design tokens and which component reads which token.',
    '',
    '## Components',
    '',
    ...(componentRows.length
      ? ['| Component | Tag | Reference |', '| --- | --- | --- |', ...componentRows]
      : ['No components are published yet.']),
    '',
    ...(hookRows.length
      ? [
          '## Composables',
          '',
          `Import them from \`${lib.name}\`.`,
          '',
          '| Composable | Reference |',
          '| --- | --- |',
          ...hookRows,
          '',
        ]
      : []),
    ...(lib.docsUrl ? ['## More', '', `Full documentation: ${lib.docsUrl}`, ''] : []),
  ]
    .filter((line, index, all) => !(line === '' && all[index - 1] === ''))
    .join('\n');

  files.set('SKILL.md', `${frontmatter(name, skillDescription(lib, sample))}\n\n${body}`);
  return files;
}
