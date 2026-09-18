import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';
import { defineLibConfig, type LibConfig } from '../config.ts';
import { ES_ENTRIES } from '../generated-entries.ts';
import { CORE_DIR, REPO_ROOT } from '../paths.ts';

async function loadConfig(): Promise<LibConfig> {
  const url = pathToFileURL(join(REPO_ROOT, 'lib.config.ts')).href;
  const mod = (await import(url)) as { default: LibConfig };
  return defineLibConfig(mod.default);
}

function vuePlugin() {
  return Vue({ isProduction: true });
}

export async function bundle(): Promise<void> {
  const lib = await loadConfig();
  const formats = lib.formats.includes('cjs') ? (['esm', 'cjs'] as const) : (['esm'] as const);
  const esEntry = Object.fromEntries(
    Object.entries(ES_ENTRIES).map(([key, rel]) => [key, join(REPO_ROOT, rel)]),
  );

  const dist = {
    cwd: CORE_DIR,
    entry: {
      index: join(CORE_DIR, 'index.ts'),
      resolver: join(CORE_DIR, 'resolver.ts'),
    },
    outDir: join(CORE_DIR, 'dist'),
    format: [...formats],
    platform: 'neutral' as const,
    plugins: [vuePlugin()],
    dts: { vue: true, eager: true },
    clean: false,
    fixedExtension: true,
    publint: true,
    attw: { profile: 'esm-only' as const, level: 'warn' as const },
    deps: { neverBundle: ['vue'] },
  };

  const es = {
    cwd: CORE_DIR,
    entry: esEntry,
    outDir: join(CORE_DIR, 'es'),
    format: ['esm'] as Array<'esm'>,
    platform: 'neutral' as const,
    plugins: [vuePlugin()],
    dts: { vue: true, eager: true },
    clean: false,
    fixedExtension: true,
    publint: false,
    attw: false,
    deps: { neverBundle: ['vue'] },
    css: {
      splitting: true,
      inject: lib.styles === 'inject',
    },
    outputOptions: {
      chunkFileNames: '_chunks/[name]-[hash].mjs',
      manualChunks(id: string) {
        if (id.replaceAll('\\', '/').includes('/packages/utils/')) return 'utils';
      },
    },
  };

  await build(es);

  // Copied before the dist build so publint sees every exported file.
  mkdirSync(join(CORE_DIR, 'dist'), { recursive: true });
  copyFileSync(join(REPO_ROOT, 'typings/global.d.ts'), join(CORE_DIR, 'dist/global.d.ts'));
  // On-demand consumers never load dist/style.css, so ship the token layer on its own.
  copyFileSync(join(CORE_DIR, 'styles/tokens.css'), join(CORE_DIR, 'dist/tokens.css'));
  const styleCss = join(CORE_DIR, 'dist/style.css');
  if (!existsSync(styleCss)) writeFileSync(styleCss, '/* @plinth/ui */\n');

  await build(dist);
}
