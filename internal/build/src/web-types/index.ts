import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LibConfig } from '../config.ts';
import { CORE_DIR } from '../paths.ts';
import { collectComponentDocs } from './collect.ts';
import { renderVetur, renderWebTypes, type PackageInfo } from './render.ts';

export { collectComponentDocs, type ComponentDoc } from './collect.ts';
export { renderVetur, renderWebTypes } from './render.ts';

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

/** Writes web-types.json, tags.json and attributes.json into packages/core/dist. */
export function emitWebTypes(lib: LibConfig): void {
  const manifest = JSON.parse(readFileSync(join(CORE_DIR, 'package.json'), 'utf8')) as {
    name: string;
    version: string;
  };
  const pkg: PackageInfo = { name: manifest.name, version: manifest.version, docsUrl: lib.docsUrl };
  const docs = collectComponentDocs();
  const outDir = join(CORE_DIR, 'dist');
  mkdirSync(outDir, { recursive: true });
  writeJson(join(outDir, 'web-types.json'), renderWebTypes(docs, pkg));
  const vetur = renderVetur(docs, pkg);
  writeJson(join(outDir, 'tags.json'), vetur.tags);
  writeJson(join(outDir, 'attributes.json'), vetur.attributes);
}
