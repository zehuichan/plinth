import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const PREPROCESSOR_CHOICES = ['none', 'scss', 'less'];

export const PREPROCESSOR_PACKAGES = {
  scss: { name: 'sass-embedded', version: '^1.93.0', lang: 'scss' },
  less: { name: 'less', version: '^4.4.0', lang: 'less' },
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

function walkVue(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkVue(full, files);
    else if (name.endsWith('.vue')) files.push(full);
  }
  return files;
}

export function addCatalogLine(workspaceText, pkg, version) {
  if (workspaceText.includes(`'${pkg}':`) || workspaceText.includes(`${pkg}:`))
    return workspaceText;
  return workspaceText.replace(/catalog:\n/, `catalog:\n  '${pkg}': ${version}\n`);
}

export function addCatalogDevDep(pkgJsonPath, pkg) {
  if (!existsSync(pkgJsonPath)) return;
  const json = readJson(pkgJsonPath);
  json.devDependencies = { ...json.devDependencies, [pkg]: 'catalog:' };
  writeJson(pkgJsonPath, json);
}

export function applyStyleLang(root, preprocessor) {
  const spec = PREPROCESSOR_PACKAGES[preprocessor];
  if (!spec) return;
  const attr = `<style lang="${spec.lang}">`;
  for (const file of walkVue(join(root, 'packages/components'))) {
    const original = readFileSync(file, 'utf8');
    const next = original.replaceAll('<style>', attr);
    if (next !== original) writeFileSync(file, next);
  }
}

export function applyPreprocessor(root, preprocessor) {
  const spec = PREPROCESSOR_PACKAGES[preprocessor];
  if (!spec) return;
  const workspacePath = join(root, 'pnpm-workspace.yaml');
  writeFileSync(
    workspacePath,
    addCatalogLine(readFileSync(workspacePath, 'utf8'), spec.name, spec.version),
  );
  for (const rel of [
    'package.json',
    'docs/package.json',
    'playground/package.json',
    'internal/build/package.json',
    'packages/core/package.json',
  ]) {
    addCatalogDevDep(join(root, rel), spec.name);
  }
  applyStyleLang(root, preprocessor);
}
