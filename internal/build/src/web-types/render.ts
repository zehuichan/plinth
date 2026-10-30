import { hyphenate, type ComponentDoc } from './collect.ts';

export interface PackageInfo {
  name: string;
  version: string;
  docsUrl?: string;
}

const WEB_TYPES_SCHEMA =
  'https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json';

function optional(key: string, value: string | undefined): Record<string, string> {
  return value ? { [key]: value } : {};
}

function docUrl(pkg: PackageInfo, doc: ComponentDoc): string | undefined {
  if (!pkg.docsUrl) return undefined;
  return `${pkg.docsUrl.replace(/\/+$/, '')}/components/${doc.seg}/`;
}

/** Markdown line announcing a `@deprecated` member, with the JSDoc note when there is one. */
function deprecationLine(item: { deprecated?: string }): string | undefined {
  if (item.deprecated === undefined) return undefined;
  return item.deprecated ? `**已废弃**：${item.deprecated}` : '**已废弃**';
}

/** The member's description with its deprecation note in front. */
function describe(item: { description: string; deprecated?: string }): string {
  return [deprecationLine(item), item.description].filter(Boolean).join('\n\n');
}

/** web-types flag for a deprecated member, so JetBrains IDEs strike it through. */
function deprecatedFlag(item: { deprecated?: string }): { deprecated?: true } {
  return item.deprecated === undefined ? {} : { deprecated: true };
}

export function renderWebTypes(docs: ComponentDoc[], pkg: PackageInfo): object {
  return {
    $schema: WEB_TYPES_SCHEMA,
    framework: 'vue',
    name: pkg.name,
    version: pkg.version,
    'js-types-syntax': 'typescript',
    'description-markup': 'markdown',
    contributions: {
      html: {
        'vue-components': docs.map((doc) => ({
          name: doc.name,
          source: { module: pkg.name, symbol: doc.name },
          ...optional('description', doc.description),
          ...optional('doc-url', docUrl(pkg, doc)),
          props: doc.props.map((p) => ({
            name: p.name,
            ...optional('description', describe(p)),
            type: p.type,
            ...optional('default', p.default),
            ...(p.required && { required: true }),
            ...deprecatedFlag(p),
          })),
          js: {
            events: doc.events.map((e) => ({
              name: e.name,
              ...optional('description', describe(e)),
              arguments: e.arguments,
              ...deprecatedFlag(e),
            })),
          },
          slots: doc.slots.map((s) => ({
            name: s.name,
            ...optional('description', describe(s)),
            ...deprecatedFlag(s),
          })),
        })),
      },
    },
  };
}

export interface VeturData {
  tags: Record<string, { description?: string; attributes: string[] }>;
  attributes: Record<string, { type?: string; description?: string; options?: string[] }>;
}

export function renderVetur(docs: ComponentDoc[], pkg: PackageInfo): VeturData {
  const tags: VeturData['tags'] = {};
  const attributes: VeturData['attributes'] = {};
  for (const doc of docs) {
    const link = docUrl(pkg, doc);
    const description = [doc.description, link].filter(Boolean).join('\n\n');
    tags[doc.tag] = {
      ...optional('description', description),
      attributes: [...doc.props, ...doc.events].map((item) => hyphenate(item.name)),
    };
    for (const p of doc.props) {
      const lines = [
        deprecationLine(p),
        p.description,
        p.default !== undefined && `默认值：\`${p.default}\``,
      ];
      attributes[`${doc.tag}/${hyphenate(p.name)}`] = {
        type: p.type,
        ...optional('description', lines.filter(Boolean).join('\n\n')),
        ...(p.options && { options: p.options }),
      };
    }
    for (const e of doc.events) {
      attributes[`${doc.tag}/${hyphenate(e.name)}`] = {
        type: 'event',
        ...optional('description', describe(e)),
      };
    }
  }
  return { tags, attributes };
}
