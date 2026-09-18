import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@plinth/ui': fileURLToPath(new URL('../packages/core/index.ts', import.meta.url)),
    },
  },
});
