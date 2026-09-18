import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { COMPONENTS_DIR, HOOKS_DIR } from '../paths.ts';

export interface ComponentInfo {
  seg: string;
  exportName: string;
  source: string;
  hasStyle: boolean;
}

export interface HookInfo {
  name: string;
  exportName: string;
}

export interface Contract {
  components: ComponentInfo[];
  hooks: HookInfo[];
}

function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort();
}

function parseComponentExports(file: string): Array<{ exportName: string; source: string }> {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out: Array<{ exportName: string; source: string }> = [];
  for (const stmt of sf.statements) {
    if (
      !ts.isExportDeclaration(stmt) ||
      !stmt.exportClause ||
      !ts.isNamedExports(stmt.exportClause)
    ) {
      continue;
    }
    const spec =
      stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)
        ? stmt.moduleSpecifier.text
        : null;
    if (!spec) continue;
    for (const el of stmt.exportClause.elements) {
      const local = el.propertyName?.text ?? el.name.text;
      if (local !== 'default' || el.name.text === 'default') continue;
      out.push({ exportName: el.name.text, source: spec });
    }
  }
  return out;
}

function dirHasStyle(dir: string): boolean {
  const files = readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (!f.isFile()) continue;
    const p = join(dir, f.name);
    if (/\.(css|scss|less)$/.test(f.name)) return true;
    if (f.name.endsWith('.vue') || f.name.endsWith('.ts')) {
      const text = readFileSync(p, 'utf8');
      if (/<style\b/.test(text) || /from ['"][^'"]+\.(css|scss|less)['"]/.test(text)) return true;
    }
  }
  return false;
}

function parseHookExport(file: string, fallback: string): string {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const stmt of sf.statements) {
    if (
      ts.isFunctionDeclaration(stmt) &&
      stmt.name &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      return stmt.name.text;
    }
    if (
      ts.isVariableStatement(stmt) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      const decl = stmt.declarationList.declarations[0];
      if (decl && ts.isIdentifier(decl.name)) return decl.name.text;
    }
    if (ts.isExportDeclaration(stmt) && stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
      const first = stmt.exportClause.elements[0];
      if (first) return first.name.text;
    }
  }
  return fallback.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()).replace(/^./, (c) => c);
}

export function derive(): Contract {
  const components: ComponentInfo[] = [];
  for (const seg of listDirs(COMPONENTS_DIR)) {
    const index = join(COMPONENTS_DIR, seg, 'index.ts');
    if (!existsSync(index)) continue;
    const exports = parseComponentExports(index);
    const hasStyle = dirHasStyle(join(COMPONENTS_DIR, seg));
    for (const item of exports) {
      components.push({ seg, exportName: item.exportName, source: item.source, hasStyle });
    }
  }

  const hooks: HookInfo[] = [];
  for (const name of listDirs(HOOKS_DIR)) {
    const index = join(HOOKS_DIR, name, 'index.ts');
    if (!existsSync(index)) continue;
    hooks.push({ name, exportName: parseHookExport(index, name) });
  }

  return { components, hooks };
}
