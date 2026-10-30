import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { createChecker } from 'vue-component-meta';
import { hyphenate } from '../ai/names.ts';
import { derive, type Contract } from '../contract/derive.ts';
import { COMPONENTS_DIR, REPO_ROOT } from '../paths.ts';

export interface PropDoc {
  name: string;
  description: string;
  type: string;
  default?: string;
  required: boolean;
  /** String literal members of `type`, unquoted. */
  options?: string[];
  /** Present when the prop has `@deprecated`; the value is the JSDoc note and may be empty. */
  deprecated?: string;
}

export interface EventArgDoc {
  name: string;
  type: string;
}

export interface EventDoc {
  name: string;
  description: string;
  arguments: EventArgDoc[];
  /** Present when the event has `@deprecated`; the value is the JSDoc note and may be empty. */
  deprecated?: string;
}

export interface SlotDoc {
  name: string;
  description: string;
  /** Present when the slot has `@deprecated`; the value is the JSDoc note and may be empty. */
  deprecated?: string;
}

export interface ComponentDoc {
  name: string;
  seg: string;
  tag: string;
  description: string;
  props: PropDoc[];
  events: EventDoc[];
  slots: SlotDoc[];
}

export { hyphenate };

/** Splits on `sep` outside of brackets and string literals. */
export function splitTopLevel(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    else if ('([{<'.includes(ch)) depth++;
    else if (')]}'.includes(ch) || (ch === '>' && text[i - 1] !== '=')) depth--;
    else if (ch === sep && depth === 0) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts.filter(Boolean);
}

export function stripUndefined(type: string): string {
  const members = splitTopLevel(type, '|');
  const kept = members.filter((m) => m !== 'undefined');
  return kept.length ? kept.join(' | ') : type;
}

export function literalOptions(type: string): string[] | undefined {
  const members = splitTopLevel(type, '|');
  const values = members.map((m) => /^(["'])(.*)\1$/.exec(m)?.[2]);
  if (!values.length || values.some((v) => v === undefined)) return undefined;
  return values as string[];
}

/** Parses `(event: "click", a: A, b: B): void` into the arguments after the event name. */
export function eventArguments(signature: string): EventArgDoc[] {
  const open = signature.indexOf('(');
  if (open < 0) return [];
  let depth = 0;
  let close = -1;
  for (let i = open; i < signature.length; i++) {
    const ch = signature[i];
    if (ch === '(') depth++;
    else if (ch === ')' && --depth === 0) {
      close = i;
      break;
    }
  }
  if (close < 0) return [];
  return splitTopLevel(signature.slice(open + 1, close), ',')
    .slice(1)
    .map((param) => {
      const colon = splitTopLevel(param, ':');
      const name = (colon.length > 1 ? colon[0]! : 'arg').replace(/^\.\.\./, '').replace(/\?$/, '');
      const type = colon.length > 1 ? param.slice(param.indexOf(':') + 1).trim() : param;
      return { name, type };
    });
}

/**
 * The `@deprecated` note of a member, from vue-component-meta's JSDoc tags.
 * `undefined` when the member is not deprecated, `''` when it has no note.
 */
export function deprecation(
  tags: ReadonlyArray<{ name: string; text?: string }>,
): string | undefined {
  const tag = tags.find((t) => t.name === 'deprecated');
  return tag ? (tag.text ?? '').trim() : undefined;
}

/**
 * Reads one value per member of every `defineEmits<{ ... }>()` type literal in an SFC.
 * Members for which `read` returns `undefined` are skipped.
 */
function readEmitMembers(
  sfc: string,
  read: (member: ts.PropertySignature) => string | undefined,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const match of sfc.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    const sf = ts.createSourceFile('x.ts', match[1]!, ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'defineEmits' &&
        node.typeArguments?.[0] &&
        ts.isTypeLiteralNode(node.typeArguments[0])
      ) {
        for (const member of node.typeArguments[0].members) {
          if (!ts.isPropertySignature(member) || !member.name) continue;
          const name =
            ts.isIdentifier(member.name) || ts.isStringLiteral(member.name)
              ? member.name.text
              : undefined;
          const value = name ? read(member) : undefined;
          if (name && value !== undefined) out.set(name, value);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return out;
}

/** JSDoc on `defineEmits<{ click: [...] }>()` members, which vue-component-meta drops for tuple syntax. */
export function emitDescriptions(sfc: string): Map<string, string> {
  return readEmitMembers(sfc, (member) => {
    const doc = ts
      .getJSDocCommentsAndTags(member)
      .filter(ts.isJSDoc)
      .map((d) => ts.getTextOfJSDocComment(d.comment) ?? '')
      .join('\n')
      .trim();
    return doc || undefined;
  });
}

/** `@deprecated` notes on `defineEmits<{ click: [...] }>()` members, dropped for tuple syntax as well. */
export function emitDeprecations(sfc: string): Map<string, string> {
  return readEmitMembers(sfc, (member) => {
    const tag = ts.getJSDocDeprecatedTag(member);
    return tag ? (ts.getTextOfJSDocComment(tag.comment) ?? '').trim() : undefined;
  });
}

export function collectComponentDocs(contract: Contract = derive()): ComponentDoc[] {
  const checker = createChecker(join(REPO_ROOT, 'tsconfig.web.json'), {
    printer: { newLine: ts.NewLineKind.LineFeed },
  });

  return contract.components.map((c) => {
    const file = join(COMPONENTS_DIR, c.seg, c.source);
    if (!existsSync(file)) {
      throw new Error(`web-types: ${c.exportName} source not found at ${file}`);
    }
    const meta = checker.getComponentMeta(file, 'default');
    const sfc = file.endsWith('.vue') ? readFileSync(file, 'utf8') : '';
    const emitDocs = emitDescriptions(sfc);
    const emitDeprecated = emitDeprecations(sfc);

    const props: PropDoc[] = meta.props
      .filter((p) => !p.global)
      .map((p) => {
        const type = stripUndefined(p.type);
        const options = literalOptions(type);
        const deprecated = deprecation(p.tags);
        return {
          name: p.name,
          description: p.description,
          type,
          ...(p.default !== undefined && { default: p.default }),
          required: p.required,
          ...(options && { options }),
          ...(deprecated !== undefined && { deprecated }),
        };
      });

    const events: EventDoc[] = meta.events.map((e) => {
      const deprecated = deprecation(e.tags) ?? emitDeprecated.get(e.name);
      return {
        name: e.name,
        description: e.description || emitDocs.get(e.name) || '',
        arguments: eventArguments(e.signature),
        ...(deprecated !== undefined && { deprecated }),
      };
    });

    const slots: SlotDoc[] = meta.slots.map((s) => {
      const deprecated = deprecation(s.tags);
      return {
        name: s.name,
        description: s.description,
        ...(deprecated !== undefined && { deprecated }),
      };
    });

    return {
      name: c.exportName,
      seg: c.seg,
      tag: hyphenate(c.exportName),
      description: meta.description ?? '',
      props,
      events,
      slots,
    };
  });
}
