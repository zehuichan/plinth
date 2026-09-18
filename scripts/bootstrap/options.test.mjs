import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildReplacements, renameTokens } from './rename.mjs';
import { writeCssPrefix, writeLibConfig, writeNpmrc } from './manifests.mjs';
import { applyPreprocessor, applyStyleLang } from './preprocessor.mjs';
import { UI_FRAMEWORKS } from './ui-frameworks.mjs';
import { pascalFromName, validateOptions } from './options.mjs';

describe('bootstrap', () => {
  it('builds replacements longest-first', () => {
    const reps = buildReplacements({
      name: '@acme/ui',
      installer: 'Acme',
      cssPrefix: 'ac',
      prefix: 'Ac',
    });
    expect(reps[0][0]).toBe('PlinthResolver');
    expect(reps.some(([from]) => from === '@plinth/ui')).toBe(true);
  });

  it('renames sentinels including PlButton', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plinth-'));
    const file = join(dir, 'sample.ts');
    writeFileSync(
      file,
      `import { PlinthResolver, PlButton } from '@plinth/ui';\napp.use(Plinth);\n--pl-color-primary\n`,
    );
    renameTokens(dir, {
      name: '@acme/ui',
      installer: 'Acme',
      cssPrefix: 'ac',
      prefix: 'Ac',
    });
    const text = readFileSync(file, 'utf8');
    expect(text).toContain('AcmeResolver');
    expect(text).toContain('@acme/ui');
    expect(text).toContain('AcButton');
    expect(text).toContain('--ac-color-primary');
    expect(text).not.toContain('PlButton');
  });

  it('renames css class sentinels, not just css variables', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plinth-'));
    const file = join(dir, 'sample.vue');
    writeFileSync(
      file,
      `.pl-button__content {}\nclass="pl-button--primary"\n--pl-color-bg\nsimple-tpl-name\n`,
    );
    renameTokens(dir, { name: '@acme/ui', installer: 'Acme', cssPrefix: 'ac', prefix: 'Ac' });
    const text = readFileSync(file, 'utf8');
    expect(text).toContain('.ac-button__content');
    expect(text).toContain('class="ac-button--primary"');
    expect(text).toContain('--ac-color-bg');
    expect(text).toContain('simple-tpl-name');
    expect(text).not.toContain('pl-button');
  });

  it('renames css variable globs used in docs', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plinth-'));
    const file = join(dir, 'guide.md');
    writeFileSync(file, 'tokens use `--pl-*`; classes use `pl-*`.\n');
    renameTokens(dir, { name: '@acme/ui', installer: 'Acme', cssPrefix: 'ac', prefix: 'Ac' });
    const text = readFileSync(file, 'utf8');
    expect(text).toBe('tokens use `--ac-*`; classes use `ac-*`.\n');
  });

  it('writes the css prefix module exactly like contract:sync', async () => {
    const { renderCssPrefix } = await import('../../internal/build/src/contract/sync.ts');
    const dir = mkdtempSync(join(tmpdir(), 'plinth-'));
    mkdirSync(join(dir, 'packages/utils/src'), { recursive: true });
    writeCssPrefix(dir, { cssPrefix: 'ac' });
    const text = readFileSync(join(dir, 'packages/utils/src/css-prefix.ts'), 'utf8');
    expect(text).toBe(renderCssPrefix('ac'));
  });

  it('writes ui.ts and npmrc forms', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plinth-'));
    writeLibConfig(dir, {
      name: 'acme-ui',
      installer: 'Acme',
      prefix: 'Ac',
      cssPrefix: 'ac',
    });
    writeNpmrc(dir, { name: 'acme-ui', registry: 'https://example.com/' });
    expect(readFileSync(join(dir, '.npmrc'), 'utf8')).toBe('registry=https://example.com/\n');
    expect(readFileSync(join(dir, 'lib.config.ts'), 'utf8')).toContain("name: 'acme-ui'");
    expect(readFileSync(join(dir, 'lib.config.ts'), 'utf8')).toContain("preprocessor: 'none'");
    expect(UI_FRAMEWORKS.antdv.uiTs).toContain('ant-design-vue');
    expect(UI_FRAMEWORKS['antdv-next'].uiTs).toContain("from 'antdv-next'");
    expect(UI_FRAMEWORKS['antdv-next'].peer).toHaveProperty('antdv-next');
    expect(UI_FRAMEWORKS.tdesign.uiTs).toContain("from 'tdesign-vue-next'");
    expect(UI_FRAMEWORKS.tdesign.peer).toHaveProperty('tdesign-vue-next');
  });

  it('validates prefix and registry', () => {
    expect(() =>
      validateOptions({
        name: '@acme/ui',
        prefix: 'A',
        registry: 'https://x',
        ui: 'none',
        ci: 'github',
      }),
    ).toThrow(/prefix/);
    expect(pascalFromName('@acme/ui-kit')).toBe('UiKit');
    expect(existsSync).toBeTypeOf('function');
    mkdirSync(mkdtempSync(join(tmpdir(), 'plinth-')), { recursive: true });
  });

  it('installs sass-embedded and stamps lang=scss when preprocessor is scss', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plinth-'));
    mkdirSync(join(dir, 'packages/components/button'), { recursive: true });
    mkdirSync(join(dir, 'packages/core'), { recursive: true });
    mkdirSync(join(dir, 'docs'), { recursive: true });
    mkdirSync(join(dir, 'playground'), { recursive: true });
    mkdirSync(join(dir, 'internal/build'), { recursive: true });
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), 'catalog:\n  vue: ^3.5.0\n');
    for (const rel of [
      'package.json',
      'docs/package.json',
      'playground/package.json',
      'internal/build/package.json',
      'packages/core/package.json',
    ]) {
      writeFileSync(join(dir, rel), JSON.stringify({ devDependencies: {} }) + '\n');
    }
    writeFileSync(
      join(dir, 'packages/components/button/button.vue'),
      '<style>\n.pl-button {}\n</style>\n',
    );
    applyPreprocessor(dir, 'scss');
    expect(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8')).toContain("'sass-embedded':");
    expect(
      JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).devDependencies['sass-embedded'],
    ).toBe('catalog:');
    expect(readFileSync(join(dir, 'packages/components/button/button.vue'), 'utf8')).toContain(
      '<style lang="scss">',
    );
  });

  it('does not rewrite scoped or existing lang attributes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plinth-'));
    mkdirSync(join(dir, 'packages/components/demo'), { recursive: true });
    writeFileSync(join(dir, 'packages/components/demo/x.vue'), '<style scoped>\n.x{}\n</style>\n');
    applyStyleLang(dir, 'less');
    expect(readFileSync(join(dir, 'packages/components/demo/x.vue'), 'utf8')).toContain(
      '<style scoped>',
    );
  });
});
